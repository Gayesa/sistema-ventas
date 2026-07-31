import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('empresa')
@UseGuards(JwtAuthGuard)
export class EmpresasController {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  @Get(':id')
  async obtenerEmpresa(@Param('id') id: string) {
    const empresa = await this.empresaRepository.findOne({ where: { id } });
    if (!empresa) {
      return { success: false, message: 'Empresa no encontrada' };
    }
    return empresa;
  }

  @Put(':id')
  async actualizarEmpresa(
    @Param('id') id: string,
    @Body() updateData: { nombre?: string; documento?: string; logo?: string; telefono?: string; direccion?: string; correo?: string; },
  ) {
    const empresa = await this.empresaRepository.findOne({ where: { id } });
    if (!empresa) {
      return { success: false, message: 'Empresa no encontrada' };
    }

    if (updateData.nombre !== undefined) empresa.nombre = updateData.nombre;
    if (updateData.documento !== undefined) empresa.documento = updateData.documento;
    if (updateData.logo !== undefined) empresa.logo = updateData.logo;
    if (updateData.telefono !== undefined) empresa.telefono = updateData.telefono;
    if (updateData.direccion !== undefined) empresa.direccion = updateData.direccion;
    if (updateData.correo !== undefined) empresa.correo = updateData.correo;

    await this.empresaRepository.save(empresa);
    return { success: true, empresa };
  }
}
