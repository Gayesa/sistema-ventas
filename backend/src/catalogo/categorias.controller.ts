import { Controller, Post, Body, Get, Param, Delete, Put, UseGuards, HttpException } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('categorias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  @Roles('ADMIN_TIENDA', 'ADMIN')
  async crear(@Body() data: any) {
    try {
      return await this.categoriasService.crear(data);
    } catch (e: any) {
      console.error('Controller Error:', e);
      throw new HttpException(e.message || 'Unknown error', 400);
    }
  }

  @Get()
  @Roles('ADMIN_TIENDA', 'ADMIN', 'VENDEDOR')
  listar() {
    return this.categoriasService.findAllByEmpresa();
  }

  @Put(':id')
  @Roles('ADMIN_TIENDA', 'ADMIN')
  actualizar(@Param('id') id: string, @Body() data: any) {
    return this.categoriasService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN_TIENDA', 'ADMIN')
  async eliminar(@Param('id') id: string) {
    try {
      return await this.categoriasService.delete(id);
    } catch (e: any) {
      console.error('Controller Delete Error:', e);
      throw new HttpException(e.message || 'Unknown error', 400);
    }
  }
}
