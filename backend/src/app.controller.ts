import { Controller, Get, Post, Put, Body, UnauthorizedException, Param, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { Usuario } from './usuarios/entities/usuario.entity';
import * as bcrypt from 'bcrypt';
import { Empresa } from './empresas/entities/empresa.entity';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LoginDto } from './auth/dto/login.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('auth/login')
  async login(@Body() credentials: LoginDto) {
    const email = credentials.email || credentials.correo;
    const password = credentials.password || credentials.pass;

    if (!email || !password) {
      throw new UnauthorizedException('Email y contraseña son requeridos');
    }

    const user = await this.dataSource.getRepository(Usuario)
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.email = :email', { email })
      .getOne();

    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    let empresa: Empresa | null = null;
    if (user.empresa_id) {
       empresa = await this.dataSource.getRepository(Empresa).findOne({ where: { id: user.empresa_id }});
    }

    // ── Generate REAL signed JWT ──
    const payload = {
      sub: user.id,
      empresa_id: user.empresa_id,
      rol: user.rol,
    };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      role: user.rol,
      token,
      name: user.nombre,
      empresa_id: user.empresa_id,
      empresa_nombre: empresa?.nombre,
      empresa_documento: empresa?.documento,
      empresa_logo: empresa?.logo
    };
  }

  // SECURED: Only authenticated users can access their own empresa data
  @Get('empresa/:id')
  @UseGuards(JwtAuthGuard)
  async getEmpresa(@Param('id') id: string, @Req() req: any) {
    // SECURITY: Users can only read their own empresa data
    if (req.user?.empresa_id !== id) {
      throw new UnauthorizedException('No tienes permiso para acceder a esta empresa');
    }
    const empresa = await this.dataSource.getRepository(Empresa).findOne({ where: { id }});
    return empresa;
  }

  @Put('empresa/:id')
  @UseGuards(JwtAuthGuard)
  async updateEmpresa(@Param('id') id: string, @Body() updateData: { nombre?: string; documento?: string; logo?: string; telefono?: string; direccion?: string; correo?: string; }, @Req() req: any) {
    // SECURITY: Users can only update their own empresa data
    if (req.user?.empresa_id !== id) {
      throw new UnauthorizedException('No tienes permiso para modificar esta empresa');
    }

    const repo = this.dataSource.getRepository(Empresa);
    const empresa = await repo.findOne({ where: { id }});
    if (!empresa) {
      return { success: false, message: 'Empresa no encontrada' };
    }
    
    if (updateData.nombre !== undefined) empresa.nombre = updateData.nombre;
    if (updateData.documento !== undefined) empresa.documento = updateData.documento;
    if (updateData.logo !== undefined) empresa.logo = updateData.logo;
    if (updateData.telefono !== undefined) empresa.telefono = updateData.telefono;
    if (updateData.direccion !== undefined) empresa.direccion = updateData.direccion;
    if (updateData.correo !== undefined) empresa.correo = updateData.correo;
    
    await repo.save(empresa);
    return { success: true, empresa };
  }
}

