import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { RenovarSuscripcionDto } from './dto/renovar-suscripcion.dto';
import { PagoSuscripcion } from './entities/pago-suscripcion.entity';
import { Empresa } from '../empresas/entities/empresa.entity'; // Ajusta la ruta a tu estructura
import { Usuario } from '../usuarios/entities/usuario.entity'; // Ajusta la ruta a tu estructura
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(PagoSuscripcion)
    private readonly pagoSuscripcionRepository: Repository<PagoSuscripcion>,
  ) {}

  async crearEmpresa(createEmpresaDto: CreateEmpresaDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Calcular periodo de gracia (30 días) o estado vencido
      let fechaVencimiento = new Date();
      if (createEmpresaDto.fechaActivacion) {
        fechaVencimiento = new Date(createEmpresaDto.fechaActivacion);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
      } else if (createEmpresaDto.estadoInicial !== undefined && !createEmpresaDto.estadoInicial) {
        fechaVencimiento = new Date(0); // Vencida
      } else {
        fechaVencimiento = new Date(0); // Por defecto vencido según el usuario
      }

      // 2. Crear la Empresa
      const nuevaEmpresa = queryRunner.manager.create(Empresa, {
        nombre: createEmpresaDto.nombreEmpresa,
        documento: createEmpresaDto.documentoEmpresa,
        fecha_vencimiento_suscripcion: fechaVencimiento,
        telefono: createEmpresaDto.telefono,
        direccion: createEmpresaDto.direccion,
        correo: createEmpresaDto.correo,
        logo: createEmpresaDto.logo,
      });

      const empresaGuardada = await queryRunner.manager.save(nuevaEmpresa);

      // 3. Crear el usuario ADMIN_TIENDA
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createEmpresaDto.passwordPropietario, salt);
      
      const nuevoUsuario = queryRunner.manager.create(Usuario, {
        nombre: createEmpresaDto.nombrePropietario,
        email: createEmpresaDto.emailPropietario,
        password: hashedPassword,
        rol: 'ADMIN_TIENDA',
        empresa_id: empresaGuardada.id,
      });

      await queryRunner.manager.save(nuevoUsuario);

      await queryRunner.commitTransaction();

      return {
        message: 'Empresa y usuario administrador creados exitosamente',
        empresa: empresaGuardada,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Error al crear la empresa y usuario: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async listarEmpresas() {
    const empresas = await this.empresaRepository.find();
    const ahora = new Date();
    
    // Obtener los administradores de tienda para cada empresa
    const usuariosAdmin = await this.dataSource.getRepository(Usuario).find({
      where: { rol: 'ADMIN_TIENDA' }
    });

    return empresas.map(empresa => {
      // Calcula is_active basándose en si la fecha de vencimiento es mayor a la actual
      const isActive = new Date(empresa.fecha_vencimiento_suscripcion) > ahora;
      
      const admins = usuariosAdmin.filter(u => u.empresa_id === empresa.id);

      return {
        ...empresa,
        is_active: isActive,
        nombrePropietario: admins.length > 0 ? admins[0].nombre : null,
        emailPropietario: admins.length > 0 ? admins[0].email : null,
        administradores: admins.map(a => ({ id: a.id, nombre: a.nombre, email: a.email }))
      };
    });
  }

  async renovarSuscripcion(empresaId: string, renovarDto: RenovarSuscripcionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const empresa = await queryRunner.manager.findOne(Empresa, { where: { id: empresaId } });
      
      if (!empresa) {
        throw new NotFoundException(`Empresa con ID ${empresaId} no encontrada`);
      }

      // Guardar el registro de PagoSuscripcion
      const nuevoPago = queryRunner.manager.create(PagoSuscripcion, {
        empresa_id: empresa.id,
        monto: renovarDto.monto,
        metodo_pago: renovarDto.metodoPago as any,
        referencia: renovarDto.referencia,
      });

      await queryRunner.manager.save(nuevoPago);

      // Actualizar la fecha de vencimiento sumando 30 días a la previa
      // Si la cuenta estaba vencida, igual le sumamos 30 días a esa fecha vencida (política estricta)
      // FIX: Si la fecha anterior era inválida o estaba vencida hace más de 30 días, renovar desde hoy
      let baseDate = empresa.fecha_vencimiento_suscripcion ? new Date(empresa.fecha_vencimiento_suscripcion) : new Date();
      
      if (isNaN(baseDate.getTime()) || baseDate < new Date()) {
        baseDate = new Date(); // Si no existía o ya estaba vencida, renueva a partir de HOY.
      }
      
      baseDate.setDate(baseDate.getDate() + 30);
      empresa.fecha_vencimiento_suscripcion = baseDate;
      await queryRunner.manager.save(empresa);

      await queryRunner.commitTransaction();

      return {
        message: 'Suscripción renovada exitosamente',
        nuevaFechaVencimiento: empresa.fecha_vencimiento_suscripcion,
        pago: nuevoPago,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async editarEmpresa(empresaId: string, updateData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const empresa = await queryRunner.manager.findOne(Empresa, { where: { id: empresaId } });
      if (!empresa) throw new NotFoundException('Empresa no encontrada');

      empresa.nombre = updateData.nombreEmpresa;
      empresa.documento = updateData.documentoEmpresa;
      
      if (updateData.telefono !== undefined) empresa.telefono = updateData.telefono;
      if (updateData.direccion !== undefined) empresa.direccion = updateData.direccion;
      if (updateData.correo !== undefined) empresa.correo = updateData.correo;
      if (updateData.logo !== undefined) empresa.logo = updateData.logo;

      // Manejo de activación manual o por fecha
      if (updateData.fechaActivacion) {
        let baseDate = new Date(updateData.fechaActivacion);
        baseDate.setDate(baseDate.getDate() + 30);
        empresa.fecha_vencimiento_suscripcion = baseDate;
      } else if (updateData.isActive !== undefined) {
        const isActiveNow = new Date(empresa.fecha_vencimiento_suscripcion) > new Date();
        if (updateData.isActive && !isActiveNow) {
          // Activar desde hoy por 30 días
          let baseDate = new Date();
          baseDate.setDate(baseDate.getDate() + 30);
          empresa.fecha_vencimiento_suscripcion = baseDate;
        } else if (!updateData.isActive && isActiveNow) {
          // Desactivar (Vencer)
          empresa.fecha_vencimiento_suscripcion = new Date(0);
        }
      }

      await queryRunner.manager.save(empresa);

      let adminQuery: any = { empresa_id: empresaId, rol: 'ADMIN_TIENDA' };
      if (updateData.adminIdEditando) {
        adminQuery.id = updateData.adminIdEditando;
      }
      const admin = await queryRunner.manager.findOne(Usuario, { where: adminQuery });
      if (admin) {
        admin.nombre = updateData.nombrePropietario;
        admin.email = updateData.emailPropietario;
        
        if (updateData.passwordPropietario && updateData.passwordPropietario.trim() !== '') {
          const salt = await bcrypt.genSalt();
          admin.password = await bcrypt.hash(updateData.passwordPropietario, salt);
        }
        await queryRunner.manager.save(admin);
      }

      await queryRunner.commitTransaction();
      return { message: 'Empresa actualizada correctamente' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Error al actualizar la empresa: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async agregarAdmin(empresaId: string, adminData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const empresa = await queryRunner.manager.findOne(Empresa, { where: { id: empresaId } });
      if (!empresa) throw new NotFoundException('Empresa no encontrada');

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(adminData.passwordPropietario, salt);
      
      const nuevoUsuario = queryRunner.manager.create(Usuario, {
        nombre: adminData.nombrePropietario,
        email: adminData.emailPropietario,
        password: hashedPassword,
        rol: 'ADMIN_TIENDA',
        empresa_id: empresa.id,
      });

      await queryRunner.manager.save(nuevoUsuario);

      await queryRunner.commitTransaction();
      return { message: 'Administrador adicional agregado exitosamente' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Error al agregar administrador: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async eliminarEmpresa(empresaId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const empresa = await queryRunner.manager.findOne(Empresa, { where: { id: empresaId } });
      if (!empresa) throw new NotFoundException('Empresa no encontrada');

      // First delete associated users
      await queryRunner.manager.delete(Usuario, { empresa_id: empresaId });
      
      // Then delete associated subscription payments (if any foreign key constraints exist)
      await queryRunner.manager.delete(PagoSuscripcion, { empresa_id: empresaId });

      // Delete the empresa itself
      await queryRunner.manager.delete(Empresa, { id: empresaId });

      await queryRunner.commitTransaction();
      return { message: 'Empresa eliminada exitosamente' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Error al eliminar la empresa: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async historialPagos(empresaId: string) {
    return this.pagoSuscripcionRepository.find({
      where: { empresa_id: empresaId },
      order: { fecha_pago: 'DESC' }
    });
  }
}
