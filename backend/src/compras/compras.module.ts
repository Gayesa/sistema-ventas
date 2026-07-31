import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprasService } from './compras.service';
import { ComprasController } from './compras.controller';
import { Compra } from './entities/compra.entity';
import { DetalleCompra } from './entities/detalle-compra.entity';
import { MovimientoInventario } from '../inventario/entities/movimiento-inventario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Compra, DetalleCompra, MovimientoInventario])],
  controllers: [ComprasController],
  providers: [ComprasService],
})
export class ComprasModule {}
