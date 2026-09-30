import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Venta } from '../ventas/entities/venta.entity';
import { DetalleVenta } from '../ventas/entities/detalle-venta.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Compra } from '../compras/entities/compra.entity';
import { InventarioLote } from '../inventario/entities/inventario-lote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Venta, DetalleVenta, Empresa, Usuario, Compra, InventarioLote])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
