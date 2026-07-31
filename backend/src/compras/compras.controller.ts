import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ComprasService } from './compras.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClsService } from 'nestjs-cls';

@Controller('compras')
@UseGuards(JwtAuthGuard)
export class ComprasController {
  constructor(
    private readonly comprasService: ComprasService,
    private readonly cls: ClsService
  ) {}

  @Post()
  async registrarCompra(@Body() dto: any) {
    const empresaId = this.cls.get('empresa_id');
    return await this.comprasService.registrarCompra(empresaId, dto);
  }

  @Get()
  async listarCompras(@Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    const empresaId = this.cls.get('empresa_id');
    return await this.comprasService.listarCompras(empresaId, fechaInicio, fechaFin);
  }
}
