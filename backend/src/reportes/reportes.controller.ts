import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Ajusta la ruta a tu auth
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('cierre-caja')
  @Roles('ADMIN_TIENDA', 'VENDEDOR')
  obtenerCierreCaja(@Request() req, @Query('fecha') fecha: string) {
    // req.user.empresa_id inyectado automáticamente gracias al Guard multitenant
    return this.reportesService.obtenerCierreCaja(req.user.empresa_id, fecha);
  }

  @Get('ventas-historicas')
  @Roles('ADMIN_TIENDA')
  obtenerVentasHistoricas(
    @Request() req,
    @Query('fecha_inicio') fechaInicio: string,
    @Query('fecha_fin') fechaFin: string
  ) {
    return this.reportesService.obtenerVentasHistoricas(req.user.empresa_id, fechaInicio, fechaFin);
  }

  @Get('top-productos')
  @Roles('ADMIN_TIENDA')
  obtenerTopProductos(@Request() req) {
    return this.reportesService.obtenerTopProductos(req.user.empresa_id);
  }

  // ---- ENDPOINTS SUPER ADMIN ----

  @Get('superadmin/empresas')
  @Roles('SUPER_ADMIN')
  obtenerListadoEmpresas() {
    return this.reportesService.obtenerListadoEmpresas();
  }

  @Get('superadmin/administradores')
  @Roles('SUPER_ADMIN')
  obtenerDirectorioAdministradores() {
    return this.reportesService.obtenerDirectorioAdministradores();
  }

  @Get('superadmin/finanzas-globales')
  @Roles('SUPER_ADMIN')
  obtenerFinanzasGlobales() {
    return this.reportesService.obtenerFinanzasGlobales();
  }

  @Get('superadmin/dashboard-stats')
  @Roles('SUPER_ADMIN')
  obtenerDashboardStats() {
    return this.reportesService.obtenerDashboardStats();
  }

  @Get('superadmin/top-productos')
  @Roles('SUPER_ADMIN')
  obtenerTopProductosGlobales() {
    return this.reportesService.obtenerTopProductosGlobales();
  }

  // ---- ENDPOINTS EXTRA EMPRESA ----

  @Get('empresa/compras')
  @Roles('ADMIN_TIENDA')
  obtenerReporteCompras(
    @Request() req,
    @Query('fecha_inicio') fechaInicio: string,
    @Query('fecha_fin') fechaFin: string
  ) {
    return this.reportesService.obtenerReporteCompras(req.user.empresa_id, fechaInicio, fechaFin);
  }

  @Get('admin/dashboard-stats')
  @Roles('ADMIN_TIENDA')
  obtenerDashboardStatsAdmin(@Request() req) {
    return this.reportesService.obtenerDashboardStatsAdmin(req.user.empresa_id);
  }
}
