import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';
import { ProductoVariante } from '../catalogo/entities/producto-variante.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Venta, DetalleVenta, ProductoVariante])],
  controllers: [VentasController],
  providers: [VentasService]
})
export class VentasModule {}
