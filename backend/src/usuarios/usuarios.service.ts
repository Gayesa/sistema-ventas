import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { ClsService } from 'nestjs-cls';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    private readonly cls: ClsService,
  ) {}

  private get empresaId(): string {
    const empresa_id = this.cls.get('empresa_id');
    if (!empresa_id) throw new Error('empresa_id no encontrado en contexto CLS');
    return empresa_id;
  }

  async findAllVendedores() {
    return this.usuariosRepository.find({
      where: {
        empresa_id: this.empresaId,
        rol: 'VENDEDOR'
      }
    });
  }

  async createVendedor(data: Partial<Usuario>) {
    if (data.email) {
      const existing = await this.usuariosRepository.findOne({ where: { email: data.email } });
      if (existing) {
        throw new ConflictException('Ya existe un usuario con este correo electrónico');
      }
    }

    let hashedPassword = data.password;
    if (data.password) {
      const salt = await bcrypt.genSalt();
      hashedPassword = await bcrypt.hash(data.password, salt);
    }
    
    const vendedor = this.usuariosRepository.create({
      ...data,
      password: hashedPassword,
      empresa_id: this.empresaId,
      rol: 'VENDEDOR'
    });
    return this.usuariosRepository.save(vendedor);
  }

  async updateVendedor(id: string, data: Partial<Usuario>) {
    const vendedor = await this.usuariosRepository.findOne({ where: { id, empresa_id: this.empresaId, rol: 'VENDEDOR' } });
    if (!vendedor) throw new NotFoundException('Vendedor no encontrado');
    
    if (data.email && data.email !== vendedor.email) {
      const existing = await this.usuariosRepository.findOne({ where: { email: data.email } });
      if (existing) {
        throw new ConflictException('Ya existe un usuario con este correo electrónico');
      }
    }

    if (data.password) {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
    }
    
    Object.assign(vendedor, data);
    return this.usuariosRepository.save(vendedor);
  }

  async deleteVendedor(id: string) {
    const result = await this.usuariosRepository.delete({ id, empresa_id: this.empresaId, rol: 'VENDEDOR' });
    if (result.affected === 0) throw new NotFoundException('Vendedor no encontrado');
    return { success: true };
  }
}
