import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Entidades (Asumidas según el diagrama)
import { Venta } from '../ventas/entities/venta.entity';
import { Devolucion } from './entities/devolucion.entity';
import { DetalleDevolucion } from './entities/detalle-devolucion.entity';
import { ProductoVariante } from '../catalogo/entities/producto-variante.entity';
import { MovimientoInventario } from '../inventario/entities/movimiento-inventario.entity';

@Injectable()
export class DevolucionesService {
  constructor(private readonly dataSource: DataSource) {}

  async procesarDevolucion(empresaId: string, vendedorId: string, dto: any) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar integridad de la Venta Original y Aislamiento Tenant
      const venta = await queryRunner.manager.findOne(Venta, {
        where: { id: dto.venta_id, empresa_id: empresaId },
        relations: { detalles: true }
      });

      if (!venta) {
        throw new NotFoundException(`Factura de venta no encontrada.`);
      }

      // 2. Crear cabecera del documento de Devolución
      const devolucion = queryRunner.manager.create(Devolucion, {
        empresa_id: empresaId,
        venta_id: venta.id,
        fecha_devolucion: new Date(),
        vendedor_id: vendedorId,
        motivo_general: dto.motivo_general,
        total_reembolsado: dto.total_reembolsado
      });

      const devolucionGuardada = await queryRunner.manager.save(devolucion);
      let totalCalculadoBackend = 0;

      // 3. Procesamiento seguro de Detalles y Kardex
      for (const detalleDto of dto.detalles) {
        if (detalleDto.cantidad_devuelta <= 0) continue;

        // Verificar que el producto exista en la venta original
        const ventaDetalleOriginal = venta.detalles.find(d => d.producto_id === detalleDto.producto_id);
        if (!ventaDetalleOriginal) {
          throw new BadRequestException(`El producto con ID ${detalleDto.producto_id} no pertenece a la venta original.`);
        }
        
        // Validación estricta: Consultar el historial de devoluciones de este producto para esta misma venta
        const historialDevuelto = await queryRunner.manager
           .createQueryBuilder(DetalleDevolucion, 'dd')
           .innerJoin('dd.devolucion', 'dev')
           .where('dev.venta_id = :ventaId', { ventaId: venta.id })
           .andWhere('dd.producto_id = :productoId', { productoId: detalleDto.producto_id })
           .select('SUM(dd.cantidad_devuelta)', 'total_historico')
           .getRawOne();
           
        const devolucionesPrevias = Number(historialDevuelto.total_historico || 0);
        
        if ((devolucionesPrevias + detalleDto.cantidad_devuelta) > ventaDetalleOriginal.cantidad) {
           throw new BadRequestException(`Alerta de Fraude: No puedes devolver más de lo comprado. Máximo disponible: ${ventaDetalleOriginal.cantidad - devolucionesPrevias}`);
        }

        // Matemáticas seguras backend
        const subtotalReembolso = detalleDto.cantidad_devuelta * ventaDetalleOriginal.precio_venta;
        totalCalculadoBackend += subtotalReembolso;

        // Guardar detalle de la devolución
        const nuevoDetalle = queryRunner.manager.create(DetalleDevolucion, {
          devolucion_id: (devolucionGuardada as any).id,
          producto_id: detalleDto.producto_id,
          cantidad_devuelta: detalleDto.cantidad_devuelta,
          estado_producto: detalleDto.estado_producto, // 'BUEN_ESTADO' | 'DEFECTUOSO'
          subtotal_reembolsado: subtotalReembolso
        } as any);
        await queryRunner.manager.save(nuevoDetalle);

        // 4. Lógica transaccional de Kardex (Inventario) con Bloqueo Pesimista
        const producto = await queryRunner.manager.findOne(ProductoVariante, {
          where: { id: detalleDto.producto_id, empresa_id: empresaId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!producto) {
            throw new NotFoundException('Producto no encontrado');
        }

        // Siempre entra al inventario primero
        const movEntrada = queryRunner.manager.create(MovimientoInventario, {
          empresa_id: empresaId,
          producto_id: producto.id,
          tipo_movimiento: 'ENTRADA',
          motivo: 'DEVOLUCION_VENTA',
          cantidad: detalleDto.cantidad_devuelta,
          referencia_id: (devolucionGuardada as any).id,
        });
        await queryRunner.manager.save(movEntrada);
        producto.stock_actual = Number(producto.stock_actual) + detalleDto.cantidad_devuelta;

        // Si está dañado, generamos merma para rastreabilidad (Kardex cuadra perfecto)
        if (detalleDto.estado_producto === 'DEFECTUOSO') {
          const movSalida = queryRunner.manager.create(MovimientoInventario, {
            empresa_id: empresaId,
            producto_id: producto.id,
            tipo_movimiento: 'SALIDA',
            motivo: 'MERMA_DAÑO', // Se saca inmediatamente del stock disponible
            cantidad: detalleDto.cantidad_devuelta,
            referencia_id: (devolucionGuardada as any).id,
          });
          await queryRunner.manager.save(movSalida);
          producto.stock_actual = Number(producto.stock_actual) - detalleDto.cantidad_devuelta;
        }

        await queryRunner.manager.save(producto);
      }

      // Validar si alguien alteró los precios desde el frontend
      if (totalCalculadoBackend !== dto.total_reembolsado) {
         throw new BadRequestException(`Inconsistencia matemática en los montos (Backend: ${totalCalculadoBackend}, Frontend: ${dto.total_reembolsado})`);
      }

      // 5. TODO: Impactar cierre de caja. Ubicar la tabla 'TurnoCaja' y restar el totalCalculadoBackend de las ventas del día.

      await queryRunner.commitTransaction();
      return { message: 'Nota de crédito generada con éxito.', devolucion: devolucionGuardada };
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Transacción fallida: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}
