import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClsService } from 'nestjs-cls';

@Controller('ventas')
@UseGuards(JwtAuthGuard)
export class VentasController {
  constructor(
    private readonly ventasService: VentasService,
    private readonly cls: ClsService
  ) {}

  @Post()
  crearVenta(@Body() body: any, @Req() req: any) {
    body.vendedor = req.user?.nombre || 'Vendedor';
    return this.ventasService.registrarVentaCompleta(body);
  }

  @Get()
  obtenerVentas() {
    return this.ventasService.obtenerHistorial();
  }
}
