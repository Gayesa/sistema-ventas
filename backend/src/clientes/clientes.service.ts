import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clientesRepo: Repository<Cliente>,
    private readonly cls: ClsService
  ) {}

  async create(data: Partial<Cliente>) {
    const empresa_id = this.cls.get('empresa_id');
    if (!empresa_id) {
      throw new BadRequestException('Contexto de empresa no identificado.');
    }

    if (!data.cedula || !data.nombres || !data.apellidos) {
      throw new BadRequestException('Cédula, nombres y apellidos son campos obligatorios.');
    }

    const cedulaLimpia = String(data.cedula).trim();

    // Validar cédula única por empresa
    const existe = await this.clientesRepo.findOne({
      where: { empresa_id, cedula: cedulaLimpia }
    });

    if (existe) {
      throw new ConflictException(`Ya existe un cliente con la cédula ${cedulaLimpia} en esta empresa.`);
    }

    const nuevoCliente = this.clientesRepo.create({
      empresa_id,
      cedula: cedulaLimpia,
      nombres: String(data.nombres).trim(),
      apellidos: String(data.apellidos).trim(),
      direccion: data.direccion ? String(data.direccion).trim() : null,
      telefono: data.telefono ? String(data.telefono).trim() : null,
      email: data.email ? String(data.email).trim().toLowerCase() : null,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      fecha_registro: data.fecha_registro ? String(data.fecha_registro).substring(0, 10) : (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      })(),
    } as any);

    return this.clientesRepo.save(nuevoCliente);
  }

  async findAll() {
    const empresa_id = this.cls.get('empresa_id');
    if (!empresa_id) return [];

    return this.clientesRepo.find({
      where: { empresa_id },
      order: { created_at: 'DESC' }
    });
  }

  async findOne(id: string) {
    const empresa_id = this.cls.get('empresa_id');
    const cliente = await this.clientesRepo.findOne({
      where: { id, empresa_id }
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado.');
    }
    return cliente;
  }

  async update(id: string, data: Partial<Cliente>) {
    const cliente = await this.findOne(id);
    const empresa_id = this.cls.get('empresa_id');

    if (data.cedula) {
      const cedulaLimpia = String(data.cedula).trim();
      const duplicate = await this.clientesRepo.findOne({
        where: { empresa_id, cedula: cedulaLimpia, id: Not(id) }
      });
      if (duplicate) {
        throw new ConflictException(`Ya existe otro cliente con la cédula ${cedulaLimpia} en esta empresa.`);
      }
      cliente.cedula = cedulaLimpia;
    }

    if (data.nombres !== undefined) cliente.nombres = String(data.nombres).trim();
    if (data.apellidos !== undefined) cliente.apellidos = String(data.apellidos).trim();
    if (data.direccion !== undefined) cliente.direccion = data.direccion ? String(data.direccion).trim() : null;
    if (data.telefono !== undefined) cliente.telefono = data.telefono ? String(data.telefono).trim() : null;
    if (data.email !== undefined) cliente.email = data.email ? String(data.email).trim().toLowerCase() : null;
    if (data.is_active !== undefined) cliente.is_active = Boolean(data.is_active);
    // fecha_registro es inmutable una vez asignada
    if (!cliente.fecha_registro && data.fecha_registro) {
      cliente.fecha_registro = String(data.fecha_registro).substring(0, 10);
    }

    return this.clientesRepo.save(cliente);
  }

  async remove(id: string) {
    const cliente = await this.findOne(id);
    await this.clientesRepo.remove(cliente);
    return { success: true, message: 'Cliente eliminado correctamente' };
  }
}
