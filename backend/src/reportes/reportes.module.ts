import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Venta } from '../ventas/entities/venta.entity';
import { DetalleVenta } from '../ventas/entities/detalle-venta.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Compra } from '../compras/entities/compra.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Venta, DetalleVenta, Empresa, Usuario, Compra])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
