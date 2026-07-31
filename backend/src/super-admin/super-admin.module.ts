import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { PagoSuscripcion } from './entities/pago-suscripcion.entity';
import { Empresa } from '../empresas/entities/empresa.entity'; // Ajusta la ruta a tu estructura
import { Usuario } from '../usuarios/entities/usuario.entity'; // Ajusta la ruta a tu estructura

@Module({
  imports: [TypeOrmModule.forFeature([PagoSuscripcion, Empresa, Usuario])],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
