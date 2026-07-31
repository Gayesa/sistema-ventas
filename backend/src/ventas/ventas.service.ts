import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';
import { ProductoVariante } from '../catalogo/entities/producto-variante.entity';
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

  async registrarVentaCompleta(data: any) {
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
      nuevaVenta.total = data.total;
      nuevaVenta.vendedor = data.vendedor || 'Vendedor';
      nuevaVenta.estado = 'COMPLETADA';
      nuevaVenta.detalles = [];

      // 2. Procesar detalles
      for (const item of data.detalles) {
        const detalle = new DetalleVenta();
        detalle.nombre_producto = item.nombre;
        detalle.cantidad = item.cantidad;
        detalle.precio_unitario = item.precio_unitario;
        detalle.subtotal = item.cantidad * item.precio_unitario;

        if (item.variante_id) {
          detalle.variante_id = item.variante_id;

          // Descontar inventario
          const variante = await queryRunner.manager.findOne(ProductoVariante, {
            where: { id: item.variante_id, empresa_id: empresaId }
          });
          if (variante) {
            if (variante.stock_actual < item.cantidad) {
              throw new BadRequestException(`No hay stock suficiente para ${item.nombre}. Stock actual: ${variante.stock_actual}`);
            }
            await queryRunner.manager.decrement(
              ProductoVariante,
              { id: variante.id },
              'stock_actual',
              item.cantidad
            );
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
