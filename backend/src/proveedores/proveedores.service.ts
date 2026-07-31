import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private proveedoresRepo: Repository<Proveedor>,
    private readonly cls: ClsService
  ) {}

  async create(data: Partial<Proveedor>) {
    const empresa_id = this.cls.get('empresa_id');
    
    // Check for duplicates
    const duplicate = await this.proveedoresRepo.findOne({
      where: [
        { empresa_id, documento: data.documento },
        { empresa_id, razon_social: data.razon_social }
      ]
    });
    
    if (duplicate) {
      throw new ConflictException(
        `Ya existe un proveedor con el documento o razón social ingresado en esta empresa.`
      );
    }

    const nuevoProveedor = this.proveedoresRepo.create({
      ...data,
      empresa_id
    });
    return this.proveedoresRepo.save(nuevoProveedor);
  }

  async findAll() {
    const empresa_id = this.cls.get('empresa_id');
    return this.proveedoresRepo.find({
      where: { empresa_id },
      order: { razon_social: 'ASC' }
    });
  }

  async findOne(id: string) {
    const empresa_id = this.cls.get('empresa_id');
    const proveedor = await this.proveedoresRepo.findOne({
      where: { id, empresa_id }
    });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');
    return proveedor;
  }

  async update(id: string, data: Partial<Proveedor>) {
    const proveedor = await this.findOne(id);
    const empresa_id = this.cls.get('empresa_id');

    if (data.documento || data.razon_social) {
      const duplicate = await this.proveedoresRepo.findOne({
        where: [
          { empresa_id, documento: data.documento || proveedor.documento, id: Not(id) },
          { empresa_id, razon_social: data.razon_social || proveedor.razon_social, id: Not(id) }
        ]
      });
      if (duplicate) {
        throw new ConflictException(
          `Ya existe otro proveedor con el documento o razón social ingresado.`
        );
      }
    }

    Object.assign(proveedor, data);
    return this.proveedoresRepo.save(proveedor);
  }

  async remove(id: string) {
    const proveedor = await this.findOne(id);
    await this.proveedoresRepo.remove(proveedor);
    return { success: true };
  }
}
