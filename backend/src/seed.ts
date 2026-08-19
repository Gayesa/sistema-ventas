import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Empresa } from './empresas/entities/empresa.entity';
import { Usuario } from './usuarios/entities/usuario.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  console.log('Iniciando proceso de seeding...');
  
  const empresaRepo = dataSource.getRepository(Empresa);
  const usuarioRepo = dataSource.getRepository(Usuario);
  
  const superAdminExists = await usuarioRepo.findOne({ where: { rol: 'SUPER_ADMIN' } });
  
  if (superAdminExists) {
    console.log('La base de datos ya contiene un SUPER_ADMIN. Seeding cancelado.');
    await app.close();
    return;
  }
  
  // Crear empresa por defecto si no hay ninguna
  let empresa = await empresaRepo.findOne({ where: {} });
  if (!empresa) {
    console.log('Creando empresa base...');
    empresa = empresaRepo.create({
      nombre: 'Administración SaaS',
      documento: '0000000000',
      telefono: '0000000',
      direccion: 'Sistema',
      correo: 'admin@saas.com',
      fecha_vencimiento_suscripcion: new Date(new Date().setFullYear(new Date().getFullYear() + 10)) // 10 years valid
    });
    await empresaRepo.save(empresa);
  }
  
  // Crear Super Admin
  console.log('Creando SUPER_ADMIN por defecto...');
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash('Admin123!', salt);
  
  const superAdmin = usuarioRepo.create({
    nombre: 'Super Administrador',
    email: 'admin@saas.com',
    password: hashedPassword,
    rol: 'SUPER_ADMIN',
    empresa_id: empresa.id,
    activo: true
  });
  
  await usuarioRepo.save(superAdmin);
  
  console.log('✅ Seeding completado con éxito. Usuario: admin@saas.com / Password: Admin123!');
  await app.close();
}

bootstrap().catch(err => {
  console.error('Error durante el seeding:', err);
  process.exit(1);
});
