import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Asumimos las entidades requeridas según tu arquitectura
import { Compra } from './entities/compra.entity';
import { DetalleCompra } from './entities/detalle-compra.entity';
import { Producto } from '../catalogo/entities/producto.entity';
import { ProductoVariante } from '../catalogo/entities/producto-variante.entity';
import { MovimientoInventario } from '../inventario/entities/movimiento-inventario.entity';
import { InventarioLote } from '../inventario/entities/inventario-lote.entity';

@Injectable()
export class ComprasService {
  constructor(private readonly dataSource: DataSource) {}

  async registrarCompra(empresaId: string, dto: any) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Guardar la Cabecera (Maestro)
      const fechaCompra = dto.fecha_ingreso ? new Date(dto.fecha_ingreso) : (dto.fecha_compra ? new Date(dto.fecha_compra) : new Date());
      const nuevaCompra = queryRunner.manager.create(Compra, {
        empresa_id: empresaId,
        proveedor_id: dto.proveedor_id,
        numero_factura_proveedor: dto.numero_factura_proveedor,
        fecha_compra: isNaN(fechaCompra.getTime()) ? new Date() : fechaCompra,
        total_compra: Math.round(Number(dto.total_compra)),
      });

      const compraGuardada = await queryRunner.manager.save(nuevaCompra);

      // 2. Iterar e insertar los detalles
      for (const detalle of dto.detalles) {
        const cantidadIngresada = Number(detalle.cantidad);
        const costoIngresado = Number(detalle.costo_unitario);

        if (isNaN(cantidadIngresada) || cantidadIngresada <= 0) {
          throw new BadRequestException('La cantidad ingresada debe ser un número positivo.');
        }

        // A. Buscar Variante y Producto con Bloqueo Pesimista
        // NOTA: Se buscan por separado sin relaciones/LEFT JOIN para evitar el error de PostgreSQL
        // "FOR UPDATE no puede ser aplicado al lado nulable de un outer join".
        let variante: ProductoVariante | null = null;
        let producto: Producto | null = null;

        variante = await queryRunner.manager.findOne(ProductoVariante, {
          where: { id: detalle.producto_id, empresa_id: empresaId },
          lock: { mode: 'pessimistic_write' },
        });

        if (variante) {
          producto = await queryRunner.manager.findOne(Producto, {
            where: { id: variante.producto_id, empresa_id: empresaId },
            lock: { mode: 'pessimistic_write' },
          });
        } else {
          // Si el ID enviado corresponde directamente al Producto base
          producto = await queryRunner.manager.findOne(Producto, {
            where: { id: detalle.producto_id, empresa_id: empresaId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!producto) {
            throw new NotFoundException(`El Producto/SKU con ID ${detalle.producto_id} no existe en esta empresa.`);
          }

          // Buscar la variante por defecto asociada al producto
          variante = await queryRunner.manager.findOne(ProductoVariante, {
            where: { producto_id: producto.id, empresa_id: empresaId },
            lock: { mode: 'pessimistic_write' },
          });
        }

        if (!producto) {
          throw new NotFoundException(`No se encontró el producto maestro asociado a la variante ${detalle.producto_id}.`);
        }

        // B. Insertar DetalleCompra vinculando a la variante correspondiente
        const nuevoDetalle = queryRunner.manager.create(DetalleCompra, {
          compra_id: compraGuardada.id,
          producto_id: variante ? variante.id : detalle.producto_id,
          cantidad: Math.round(cantidadIngresada),
          costo_unitario: Math.round(costoIngresado),
          subtotal: Math.round(cantidadIngresada * costoIngresado),
        });
        await queryRunner.manager.save(nuevoDetalle);

        // C. Validación y creación/actualización de Lote si el producto controla lotes
        if (producto.controla_lotes) {
          if (!detalle.numero_lote || !String(detalle.numero_lote).trim()) {
            throw new BadRequestException(
              `El producto '${producto.nombre}' controla lotes y exige 'Nº Lote'.`
            );
          }

          if (!detalle.fecha_vencimiento) {
            throw new BadRequestException(
              `El producto '${producto.nombre}' controla lotes y exige 'Fecha de Vencimiento'.`
            );
          }

          const fechaVencimiento = new Date(detalle.fecha_vencimiento);
          if (isNaN(fechaVencimiento.getTime())) {
            throw new BadRequestException(
              `La fecha de vencimiento ('${detalle.fecha_vencimiento}') tiene un formato inválido.`
            );
          }

          const numLote = String(detalle.numero_lote).trim();

          // Verificar si ya existe el lote para este producto y empresa
          let loteExistente = await queryRunner.manager.findOne(InventarioLote, {
            where: {
              empresa_id: empresaId,
              producto_id: producto.id,
              numero_lote: numLote,
            },
          });

          if (loteExistente) {
            loteExistente.stock_actual = Number(loteExistente.stock_actual || 0) + cantidadIngresada;
            loteExistente.fecha_vencimiento = fechaVencimiento;
            await queryRunner.manager.save(loteExistente);
          } else {
            const nuevoLote = queryRunner.manager.create(InventarioLote, {
              empresa_id: empresaId,
              producto_id: producto.id,
              numero_lote: numLote,
              fecha_vencimiento: fechaVencimiento,
              stock_actual: cantidadIngresada,
            });
            await queryRunner.manager.save(nuevoLote);
          }
        }

        // D. Sumar stock total en la tabla Producto
        producto.stock_total = Number(producto.stock_total || 0) + cantidadIngresada;
        await queryRunner.manager.save(producto);

        // E. Si existe registro de Variante, actualizar su stock_actual y costo promedio ponderado
        if (variante) {
          const stockAnterior = Number(variante.stock_actual) || 0;
          const costoAnterior = Number(variante.precio_compra) || 0;
          const nuevoStock = stockAnterior + cantidadIngresada;
          const costoPromedio = nuevoStock > 0
            ? ((stockAnterior * costoAnterior) + (cantidadIngresada * costoIngresado)) / nuevoStock
            : costoIngresado;

          variante.stock_actual = nuevoStock;
          variante.precio_compra = Math.round(costoPromedio * 100) / 100;
          await queryRunner.manager.save(variante);
        }

        // F. Insertar en el Kardex (MovimientoInventario)
        const movimiento = queryRunner.manager.create(MovimientoInventario, {
          empresa_id: empresaId,
          producto_id: variante ? variante.id : producto.id,
          tipo_movimiento: 'ENTRADA',
          motivo: 'COMPRA',
          cantidad: cantidadIngresada,
          referencia_id: compraGuardada.id,
        });
        await queryRunner.manager.save(movimiento);
      }

      await queryRunner.commitTransaction();
      return { 
        message: 'Compra registrada con éxito, inventario actualizado y costos recalculados.', 
        compra: compraGuardada 
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Fallo al registrar la compra: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async listarCompras(empresaId: string, fechaInicio?: string, fechaFin?: string) {
    if (!empresaId) {
      return [];
    }

    const query = this.dataSource.getRepository(Compra).createQueryBuilder('compra')
      .where('compra.empresa_id = :empresaId', { empresaId })
      .orderBy('compra.fecha_compra', 'DESC');

    if (fechaInicio) {
      const inicio = new Date(`${fechaInicio}T00:00:00.000Z`);
      query.andWhere('compra.fecha_compra >= :inicio', { inicio });
    }
    
    if (fechaFin) {
      const fin = new Date(`${fechaFin}T23:59:59.999Z`);
      query.andWhere('compra.fecha_compra <= :fin', { fin });
    }

    const compras = await query.getMany();

    // Fetch details manually to bypass the varchar vs uuid TypeORM JOIN limitation
    for (const c of compras) {
      const detallesRaw = await this.dataSource.query(`
        SELECT d.cantidad, d.costo_unitario, d.subtotal, pv.sku, p.nombre
        FROM detalle_compra d
        LEFT JOIN producto_variantes pv ON pv.id::varchar = d.producto_id::varchar
        LEFT JOIN productos p ON p.id = pv.producto_id
        WHERE d.compra_id = $1
      `, [c.id]);

      c.detalles = detallesRaw.map(r => ({
        cantidad: r.cantidad,
        costo_unitario: r.costo_unitario,
        subtotal: r.subtotal,
        producto: {
          sku: r.sku,
          producto: {
            nombre: r.nombre
          }
        }
      })) as any;
    }

    return compras;
  }
}
