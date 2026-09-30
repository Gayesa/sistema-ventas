import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';
import { Producto } from '../catalogo/entities/producto.entity';
import { ProductoVariante } from '../catalogo/entities/producto-variante.entity';
import { InventarioLote } from '../inventario/entities/inventario-lote.entity';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class VentasService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cls: ClsService
  ) {}

  async obtenerHistorial() {
    const empresaId = this.cls.get('empresa_id');
    return this.dataSource.getRepository(Venta).find({
      where: { empresa_id: empresaId },
      relations: { detalles: true },
      order: { fecha: 'DESC' }
    });
  }

  /**
   * Alias de compatibilidad hacia procesarVenta()
   */
  async registrarVentaCompleta(data: any) {
    return this.procesarVenta(data);
  }

  /**
   * Algoritmo transaccional crítico para procesar venta con soporte FEFO
   */
  async procesarVenta(data: any) {
    const empresaId = this.cls.get('empresa_id');
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Crear cabecera de la venta
      const nuevaVenta = new Venta();
      nuevaVenta.empresa_id = empresaId;
      nuevaVenta.numero_ticket = data.ticket || `TKT-${Date.now()}`;
      nuevaVenta.metodo_pago = data.metodo_pago;
      nuevaVenta.total = Number(data.total);
      nuevaVenta.vendedor = data.vendedor || 'Vendedor';
      nuevaVenta.pagos_detalle = data.pagos_detalle || null;
      nuevaVenta.cliente_id = data.cliente_id || null;
      nuevaVenta.cliente_datos = data.cliente_datos || null;
      nuevaVenta.estado = 'COMPLETADA';
      nuevaVenta.detalles = [];

      // 2. Procesar detalles con lógica FEFO
      for (const item of data.detalles) {
        const cantidadRequerida = Number(item.cantidad);
        const precioUnitario = Number(item.precio_unitario);

        if (isNaN(cantidadRequerida) || cantidadRequerida <= 0) {
          throw new BadRequestException('La cantidad vendida debe ser mayor a cero.');
        }

        const detalle = new DetalleVenta();
        detalle.nombre_producto = item.nombre;
        detalle.cantidad = cantidadRequerida;
        detalle.precio_unitario = precioUnitario;
        detalle.precio_venta = precioUnitario;
        detalle.subtotal = cantidadRequerida * precioUnitario;

        // Identificar Producto y Variante (bloqueo pesimista sin outer joins)
        let producto: Producto | null = null;
        let variante: ProductoVariante | null = null;

        if (item.variante_id) {
          variante = await queryRunner.manager.findOne(ProductoVariante, {
            where: { id: item.variante_id, empresa_id: empresaId },
            lock: { mode: 'pessimistic_write' },
          });

          if (variante) {
            detalle.variante_id = variante.id;
            producto = await queryRunner.manager.findOne(Producto, {
              where: { id: variante.producto_id, empresa_id: empresaId },
              lock: { mode: 'pessimistic_write' },
            });
          }
        }

        if (!producto && item.producto_id) {
          producto = await queryRunner.manager.findOne(Producto, {
            where: { id: item.producto_id, empresa_id: empresaId },
            lock: { mode: 'pessimistic_write' },
          });

          if (producto && !variante) {
            variante = await queryRunner.manager.findOne(ProductoVariante, {
              where: { producto_id: producto.id, empresa_id: empresaId },
              lock: { mode: 'pessimistic_write' },
            });
          }
        }

        if (producto) {
          detalle.producto_id = producto.id;
        }

        // LÓGICA FEFO (First Expired, First Out)
        if (producto && producto.controla_lotes) {
          // a) Buscar lotes con stock > 0 ordenados por fecha_vencimiento ASC
          const lotesDisponibles = await queryRunner.manager
            .createQueryBuilder(InventarioLote, 'lote')
            .setLock('pessimistic_write')
            .where('lote.empresa_id = :empresaId', { empresaId })
            .andWhere('lote.producto_id = :productoId', { productoId: producto.id })
            .andWhere('lote.stock_actual > 0')
            .orderBy('lote.fecha_vencimiento', 'ASC')
            .getMany();

          const totalStockLotes = lotesDisponibles.reduce(
            (acc, l) => acc + Number(l.stock_actual),
            0
          );

          if (totalStockLotes < cantidadRequerida) {
            throw new BadRequestException(
              `Stock insuficiente en lotes para '${producto.nombre}'. Solicitado: ${cantidadRequerida}, disponible en lotes activos: ${totalStockLotes}.`
            );
          }

          // b) Iterar sobre lotes descontando cantidad requerida hasta satisfacer la venta
          let pendientePorDescontar = cantidadRequerida;

          for (const lote of lotesDisponibles) {
            if (pendientePorDescontar <= 0) break;

            const stockLote = Number(lote.stock_actual);
            const aDescontar = Math.min(stockLote, pendientePorDescontar);

            // c) Actualizar stock_actual de cada lote dentro de la transacción
            lote.stock_actual = stockLote - aDescontar;
            pendientePorDescontar -= aDescontar;

            await queryRunner.manager.save(lote);
          }

          // Actualizar stock total consolidado
          producto.stock_total = Math.max(0, Number(producto.stock_total || 0) - cantidadRequerida);
          await queryRunner.manager.save(producto);

          if (variante) {
            variante.stock_actual = Math.max(0, Number(variante.stock_actual || 0) - cantidadRequerida);
            await queryRunner.manager.save(variante);
          }

        } else if (variante) {
          // Descuento estándar para productos sin control de lotes
          const stockActual = Number(variante.stock_actual);
          if (stockActual < cantidadRequerida) {
            throw new BadRequestException(
              `No hay stock suficiente para ${item.nombre || producto?.nombre}. Stock actual: ${stockActual}`
            );
          }

          variante.stock_actual = stockActual - cantidadRequerida;
          await queryRunner.manager.save(variante);

          if (producto) {
            producto.stock_total = Math.max(0, Number(producto.stock_total || 0) - cantidadRequerida);
            await queryRunner.manager.save(producto);
          }
        }

        nuevaVenta.detalles.push(detalle);
      }

      await queryRunner.manager.save(nuevaVenta);
      await queryRunner.commitTransaction();

      return { message: 'Venta registrada con éxito', venta: nuevaVenta };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Error al procesar la venta: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}
