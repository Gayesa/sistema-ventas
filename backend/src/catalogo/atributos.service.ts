import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AtributoGlobal } from './entities/atributo-global.entity';
import { AtributoValor } from './entities/atributo-valor.entity';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AtributosService {
  constructor(
    @InjectRepository(AtributoGlobal)
    private atributosRepo: Repository<AtributoGlobal>,
    @InjectRepository(AtributoValor)
    private valoresRepo: Repository<AtributoValor>,
    private readonly cls: ClsService
  ) {}

  async findAll() {
    const empresa_id = this.cls.get('empresa_id');
    return this.atributosRepo.find({
      where: { empresa_id },
      relations: { valores: true },
      order: { created_at: 'ASC' }
    });
  }

  async createAtributo(data: { nombre: string }) {
    const empresa_id = this.cls.get('empresa_id');
    if (!data.nombre || data.nombre.trim() === '') {
      throw new BadRequestException('El nombre del atributo es requerido');
    }

    const nombre = data.nombre.trim();
    
    // Validar duplicado
    const existe = await this.atributosRepo.findOne({
      where: { empresa_id, nombre: nombre }
    });

    if (existe) {
      throw new ConflictException(`El atributo "${nombre}" ya existe`);
    }

    const atributo = this.atributosRepo.create({
      empresa_id,
      nombre
    });

    return await this.atributosRepo.save(atributo);
  }

  async updateAtributo(atributoId: string, data: { nombre: string }) {
    const empresa_id = this.cls.get('empresa_id');
    const atributo = await this.atributosRepo.findOne({
      where: { id: atributoId, empresa_id }
    });

    if (!atributo) {
      throw new NotFoundException('Atributo no encontrado');
    }

    if (!data.nombre || data.nombre.trim() === '') {
      throw new BadRequestException('El nombre del atributo es requerido');
    }

    const nombre = data.nombre.trim();
    
    // Check if new name exists (except for current)
    const existe = await this.atributosRepo.findOne({
      where: { empresa_id, nombre }
    });
    if (existe && existe.id !== atributoId) {
      throw new ConflictException(`El atributo "${nombre}" ya existe`);
    }

    atributo.nombre = nombre;
    return await this.atributosRepo.save(atributo);
  }

  async addValor(atributoId: string, data: { valor: string }) {
    const empresa_id = this.cls.get('empresa_id');
    if (!data.valor || data.valor.trim() === '') {
      throw new BadRequestException('El valor es requerido');
    }

    const atributo = await this.atributosRepo.findOne({
      where: { id: atributoId, empresa_id }
    });

    if (!atributo) {
      throw new NotFoundException('Atributo no encontrado');
    }

    const valorFormateado = data.valor.trim();

    // Validar si el valor ya existe para ese atributo
    const existe = await this.valoresRepo.findOne({
      where: { atributo_id: atributoId, valor: valorFormateado }
    });

    if (existe) {
      throw new ConflictException(`El valor "${valorFormateado}" ya existe en este atributo`);
    }

    const nuevoValor = this.valoresRepo.create({
      atributo_id: atributoId,
      valor: valorFormateado
    });

    return await this.valoresRepo.save(nuevoValor);
  }

  async updateValor(atributoId: string, valorId: string, data: { valor: string }) {
    const empresa_id = this.cls.get('empresa_id');
    const atributo = await this.atributosRepo.findOne({
      where: { id: atributoId, empresa_id }
    });

    if (!atributo) {
      throw new NotFoundException('Atributo no encontrado');
    }

    const valorEntity = await this.valoresRepo.findOne({
      where: { id: valorId, atributo_id: atributoId }
    });

    if (!valorEntity) {
      throw new NotFoundException('Valor no encontrado');
    }

    if (!data.valor || data.valor.trim() === '') {
      throw new BadRequestException('El valor es requerido');
    }

    const nuevoValorText = data.valor.trim();

    const existe = await this.valoresRepo.findOne({
      where: { atributo_id: atributoId, valor: nuevoValorText }
    });

    if (existe && existe.id !== valorId) {
      throw new ConflictException(`El valor "${nuevoValorText}" ya existe en este atributo`);
    }

    valorEntity.valor = nuevoValorText;
    return await this.valoresRepo.save(valorEntity);
  }

  async removeValor(atributoId: string, valorId: string) {
    const empresa_id = this.cls.get('empresa_id');
    
    // Verify that the attribute belongs to the tenant
    const atributo = await this.atributosRepo.findOne({
      where: { id: atributoId, empresa_id }
    });

    if (!atributo) {
      throw new NotFoundException('Atributo no encontrado');
    }

    const valor = await this.valoresRepo.findOne({
      where: { id: valorId, atributo_id: atributoId }
    });

    if (!valor) {
      throw new NotFoundException('Valor no encontrado');
    }

    await this.valoresRepo.remove(valor);
    return { success: true, message: 'Valor eliminado' };
  }

  async removeAtributo(atributoId: string) {
    const empresa_id = this.cls.get('empresa_id');
    const atributo = await this.atributosRepo.findOne({
      where: { id: atributoId, empresa_id }
    });

    if (!atributo) {
      throw new NotFoundException('Atributo no encontrado');
    }

    await this.atributosRepo.remove(atributo);
    return { success: true, message: 'Atributo eliminado' };
  }
}
