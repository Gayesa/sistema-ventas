import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Asumimos las entidades requeridas según tu arquitectura
import { Compra } from './entities/compra.entity';
import { DetalleCompra } from './entities/detalle-compra.entity';
import { ProductoVariante } from '../catalogo/entities/producto-variante.entity';
import { MovimientoInventario } from '../inventario/entities/movimiento-inventario.entity';

@Injectable()
export class ComprasService {
  constructor(private readonly dataSource: DataSource) {}

  async registrarCompra(empresaId: string, dto: any) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Guardar la Cabecera (Maestro)
      const nuevaCompra = queryRunner.manager.create(Compra, {
        empresa_id: empresaId,
        proveedor_id: dto.proveedor_id,
        numero_factura_proveedor: dto.numero_factura_proveedor,
        fecha_compra: new Date(),
        total_compra: Math.round(Number(dto.total_compra)),
      });

      const compraGuardada = await queryRunner.manager.save(nuevaCompra);

      // 2. Iterar e insertar los detalles
      for (const detalle of dto.detalles) {
        
        // A. Insertar DetalleCompra
        const nuevoDetalle = queryRunner.manager.create(DetalleCompra, {
          compra_id: compraGuardada.id,
          producto_id: detalle.producto_id,
          cantidad: Math.round(Number(detalle.cantidad)),
          costo_unitario: Math.round(Number(detalle.costo_unitario)),
          subtotal: Math.round(Number(detalle.cantidad) * Number(detalle.costo_unitario)),
        });
        await queryRunner.manager.save(nuevoDetalle);

        // BUSCAMOS EL PRODUCTO (Variante) CON PESSIMISTIC LOCKING
        // Esto evita condiciones de carrera si se vende y compra a la vez
        const producto = await queryRunner.manager.findOne(ProductoVariante, {
          where: { id: detalle.producto_id, empresa_id: empresaId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!producto) {
          throw new NotFoundException(`El SKU/Producto con ID ${detalle.producto_id} no existe.`);
        }

        const cantidadIngresada = Number(detalle.cantidad);
        const costoIngresado = Number(detalle.costo_unitario);
        
        const stockAnterior = Number(producto.stock_actual);
        const costoAnterior = Number(producto.precio_compra) || 0;

        // B. Insertar en el Kardex (MovimientoInventario)
        const movimiento = queryRunner.manager.create(MovimientoInventario, {
          empresa_id: empresaId,
          producto_id: producto.id,
          tipo_movimiento: 'ENTRADA',
          motivo: 'COMPRA',
          cantidad: cantidadIngresada,
          referencia_id: compraGuardada.id, 
        });
        await queryRunner.manager.save(movimiento);

        // C. Lógica de Costo Promedio Ponderado y Suma de Stock
        const costoPromedio = ((stockAnterior * costoAnterior) + (cantidadIngresada * costoIngresado)) / (stockAnterior + cantidadIngresada);

        // Actualizamos las propiedades mutables
        producto.stock_actual = stockAnterior + cantidadIngresada;
        producto.precio_compra = costoPromedio;

        // Persistimos los cambios del producto
        await queryRunner.manager.save(producto);
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
    const query = this.dataSource.getRepository(Compra).createQueryBuilder('compra')
      .where('compra.empresa_id = :empresaId', { empresaId })
      .orderBy('compra.fecha_compra', 'DESC');

    if (fechaInicio) {
      query.andWhere('compra.fecha_compra >= :fechaInicio', { fechaInicio });
    }
    
    if (fechaFin) {
      query.andWhere('compra.fecha_compra <= :fechaFin', { fechaFin: fechaFin + ' 23:59:59' });
    }

    const compras = await query.getMany();

    // Fetch details manually to bypass the varchar vs uuid TypeORM JOIN limitation
    for (const c of compras) {
      const detallesRaw = await this.dataSource.query(`
        SELECT d.cantidad, d.costo_unitario, d.subtotal, pv.sku, p.nombre
        FROM detalle_compra d
        LEFT JOIN producto_variantes pv ON pv.id::varchar = d.producto_id
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
