import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Categoria } from './entities/categoria.entity';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private categoriasRepository: Repository<Categoria>,
    private readonly cls: ClsService
  ) {}

  async crear(data: any): Promise<Categoria> {
    const empresa_id = this.cls.get('empresa_id');

    // Validar nombre requerido
    if (!data.nombre || data.nombre.trim().length === 0) {
      throw new BadRequestException('El nombre de la categoría es requerido');
    }

    const nombreNormalizado = data.nombre.trim();

    // Validar nombre duplicado dentro de la misma empresa y mismo nivel (padre/hija)
    const duplicado = await this.categoriasRepository.findOne({
      where: {
        empresa_id,
        nombre: nombreNormalizado,
        parent_id: data.parent_id ? data.parent_id : IsNull()
      }
    });

    if (duplicado) {
      throw new ConflictException(`Ya existe una categoría con el nombre "${nombreNormalizado}" en este nivel`);
    }

    // Si es subcategoría, validar que el padre existe y pertenece a la misma empresa
    if (data.parent_id) {
      const padre = await this.categoriasRepository.findOne({
        where: { id: data.parent_id, empresa_id }
      });
      if (!padre) {
        throw new BadRequestException('La categoría padre seleccionada no existe');
      }
      // No permitir subcategorías de subcategorías (solo 2 niveles)
      if (padre.parent_id) {
        throw new BadRequestException('No se permite crear sub-subcategorías. Solo se permiten 2 niveles de jerarquía');
      }
    }

    const categoria = this.categoriasRepository.create({
      empresa_id,
      nombre: nombreNormalizado,
      descripcion: data.descripcion?.trim() || null,
      parent_id: data.parent_id || null
    });
    try {
      return await this.categoriasRepository.save(categoria);
    } catch (error: any) {
      console.error('DB Save Error:', error);
      throw new BadRequestException('Error DB: ' + error.message);
    }
  }

  async findAllByEmpresa(): Promise<Categoria[]> {
    const empresa_id = this.cls.get('empresa_id');
    return await this.categoriasRepository.find({
      where: { empresa_id }
    });
  }

  async update(id: string, data: any): Promise<Categoria> {
    const empresa_id = this.cls.get('empresa_id');
    const categoria = await this.categoriasRepository.findOne({ where: { id, empresa_id } });
    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (data.nombre !== undefined) {
      if (!data.nombre || data.nombre.trim().length === 0) {
        throw new BadRequestException('El nombre de la categoría es requerido');
      }

      const nombreNormalizado = data.nombre.trim();

      // Validar nombre duplicado (excluyendo la categoría actual)
      const duplicado = await this.categoriasRepository
        .createQueryBuilder('c')
        .where('c.empresa_id = :empresa_id', { empresa_id })
        .andWhere('c.nombre = :nombre', { nombre: nombreNormalizado })
        .andWhere('c.id != :id', { id })
        .andWhere(data.parent_id !== undefined 
          ? 'c.parent_id = :parent_id' 
          : (categoria.parent_id ? 'c.parent_id = :parent_id' : 'c.parent_id IS NULL'),
          { parent_id: data.parent_id !== undefined ? data.parent_id : categoria.parent_id }
        )
        .getOne();

      if (duplicado) {
        throw new ConflictException(`Ya existe una categoría con el nombre "${nombreNormalizado}" en este nivel`);
      }

      categoria.nombre = nombreNormalizado;
    }

    if (data.descripcion !== undefined) {
      categoria.descripcion = data.descripcion?.trim() || null;
    }

    if (data.parent_id !== undefined) {
      // Validar que no se asigne a sí misma como padre
      if (data.parent_id === id) {
        throw new BadRequestException('Una categoría no puede ser su propio padre');
      }
      
      if (data.parent_id) {
        const padre = await this.categoriasRepository.findOne({
          where: { id: data.parent_id, empresa_id }
        });
        if (!padre) {
          throw new BadRequestException('La categoría padre seleccionada no existe');
        }
        if (padre.parent_id) {
          throw new BadRequestException('No se permite crear sub-subcategorías. Solo se permiten 2 niveles de jerarquía');
        }
      }
      categoria.parent_id = data.parent_id;
    }

    return await this.categoriasRepository.save(categoria);
  }

  async delete(id: string): Promise<void> {
    const empresa_id = this.cls.get('empresa_id');
    
    // Verificar que la categoría existe
    const categoria = await this.categoriasRepository.findOne({ where: { id, empresa_id } });
    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada o ya eliminada');
    }

    try {
      // Si es categoría padre, verificar si tiene subcategorías
      if (!categoria.parent_id) {
        const subcategorias = await this.categoriasRepository.find({ where: { parent_id: id, empresa_id } });
        if (subcategorias.length > 0) {
          throw new BadRequestException('No se puede eliminar la categoría porque tiene subcategorías asignadas.');
        }
      }

      await this.categoriasRepository.remove(categoria);
    } catch (error: any) {
      if (error.code === '23503') {
        throw new BadRequestException('No se puede eliminar la categoría porque existen productos asociados a ella o a sus subcategorías.');
      }
      throw error;
    }
  }
}
 
