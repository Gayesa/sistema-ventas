import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { AtributosService } from './atributos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('atributos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AtributosController {
  constructor(private readonly atributosService: AtributosService) {}

  @Get()
  @Roles('ADMIN_TIENDA', 'ADMIN')
  findAll() {
    return this.atributosService.findAll();
  }

  @Post()
  @Roles('ADMIN_TIENDA', 'ADMIN')
  create(@Body() data: { nombre: string }) {
    return this.atributosService.createAtributo(data);
  }

  @Patch(':id')
  @Roles('ADMIN_TIENDA', 'ADMIN')
  updateAtributo(@Param('id') id: string, @Body() data: { nombre: string }) {
    return this.atributosService.updateAtributo(id, data);
  }

  @Post(':id/valores')
  @Roles('ADMIN_TIENDA', 'ADMIN')
  addValor(@Param('id') id: string, @Body() data: { valor: string }) {
    return this.atributosService.addValor(id, data);
  }

  @Patch(':id/valores/:valorId')
  @Roles('ADMIN_TIENDA', 'ADMIN')
  updateValor(@Param('id') id: string, @Param('valorId') valorId: string, @Body() data: { valor: string }) {
    return this.atributosService.updateValor(id, valorId, data);
  }

  @Delete(':id/valores/:valorId')
  @Roles('ADMIN_TIENDA', 'ADMIN')
  removeValor(@Param('id') id: string, @Param('valorId') valorId: string) {
    return this.atributosService.removeValor(id, valorId);
  }

  @Delete(':id')
  @Roles('ADMIN_TIENDA', 'ADMIN')
  removeAtributo(@Param('id') id: string) {
    return this.atributosService.removeAtributo(id);
  }
}
