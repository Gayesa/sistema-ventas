import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('productos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @Roles('ADMIN_TIENDA', 'ADMIN') // Adjust roles as needed
  create(@Body() data: any) {
    return this.productosService.create(data);
  }

  @Get()
  @Roles('ADMIN_TIENDA', 'ADMIN', 'VENDEDOR')
  findAll() {
    return this.productosService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN_TIENDA', 'ADMIN', 'VENDEDOR')
  findOne(@Param('id') id: string) {
    return this.productosService.findOne(id);
  }

  @Get(':id/kardex')
  @Roles('ADMIN_TIENDA', 'ADMIN', 'VENDEDOR')
  getKardex(@Param('id') id: string) {
    return this.productosService.getKardex(id);
  }

  @Patch(':id')
  @Roles('ADMIN_TIENDA', 'ADMIN')
  update(@Param('id') id: string, @Body() data: any) {
    return this.productosService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN_TIENDA', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.productosService.remove(id);
  }
}
