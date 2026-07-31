import { Controller, Post, Body, Get, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { RenovarSuscripcionDto } from './dto/renovar-suscripcion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Ajusta la ruta a tu estructura
import { RolesGuard } from '../auth/guards/roles.guard'; // Ajusta la ruta a tu estructura
import { Roles } from '../auth/decorators/roles.decorator'; // Ajusta la ruta a tu estructura

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Post('empresas')
  crearEmpresa(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.superAdminService.crearEmpresa(createEmpresaDto);
  }

  @Get('empresas')
  listarEmpresas() {
    return this.superAdminService.listarEmpresas();
  }

  @Post('pagos/renovar/:empresa_id')
  renovarSuscripcion(
    @Param('empresa_id') empresaId: string,
    @Body() renovarDto: RenovarSuscripcionDto,
  ) {
    return this.superAdminService.renovarSuscripcion(empresaId, renovarDto);
  }

  @Patch('empresas/:id')
  editarEmpresa(
    @Param('id') empresaId: string,
    @Body() updateData: any,
  ) {
    return this.superAdminService.editarEmpresa(empresaId, updateData);
  }

  @Delete('empresas/:id')
  eliminarEmpresa(@Param('id') empresaId: string) {
    return this.superAdminService.eliminarEmpresa(empresaId);
  }

  @Post('empresas/:id/admins')
  agregarAdmin(
    @Param('id') empresaId: string,
    @Body() adminData: any,
  ) {
    return this.superAdminService.agregarAdmin(empresaId, adminData);
  }

  @Get('pagos/historial/:empresa_id')
  historialPagos(@Param('empresa_id') empresaId: string) {
    return this.superAdminService.historialPagos(empresaId);
  }
}
