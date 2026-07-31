import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vendedores')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll() {
    return this.usuariosService.findAllVendedores();
  }

  @Post()
  create(@Body() data: any) {
    return this.usuariosService.createVendedor(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.usuariosService.updateVendedor(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuariosService.deleteVendedor(id);
  }
}
