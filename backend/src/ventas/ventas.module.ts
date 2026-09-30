import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';
import { Producto } from '../catalogo/entities/producto.entity';
import { ProductoVariante } from '../catalogo/entities/producto-variante.entity';
import { InventarioLote } from '../inventario/entities/inventario-lote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venta,
      DetalleVenta,
      Producto,
      ProductoVariante,
      InventarioLote,
    ]),
  ],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
