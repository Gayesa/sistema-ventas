import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprasService } from './compras.service';
import { ComprasController } from './compras.controller';
import { Compra } from './entities/compra.entity';
import { DetalleCompra } from './entities/detalle-compra.entity';
import { Producto } from '../catalogo/entities/producto.entity';
import { ProductoVariante } from '../catalogo/entities/producto-variante.entity';
import { MovimientoInventario } from '../inventario/entities/movimiento-inventario.entity';
import { InventarioLote } from '../inventario/entities/inventario-lote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Compra,
      DetalleCompra,
      MovimientoInventario,
      Producto,
      ProductoVariante,
      InventarioLote,
    ]),
  ],
  controllers: [ComprasController],
  providers: [ComprasService],
})
export class ComprasModule {}
