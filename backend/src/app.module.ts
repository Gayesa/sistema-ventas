import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportesModule } from './reportes/reportes.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { ComprasModule } from './compras/compras.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EmpresasModule } from './empresas/empresas.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { VentasModule } from './ventas/ventas.module';
import { HealthModule } from './health/health.module';

import { ClsModule } from 'nestjs-cls';
import * as Joi from 'joi';

@Module({
  imports: [
    // ── Environment Configuration with Validation ──
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        // Database
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        // JWT
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRATION: Joi.string().default('8h'),
        // App
        PORT: Joi.number().default(3000),
        CORS_ORIGIN: Joi.string().default('http://localhost:4200'),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      }),
      validationOptions: {
        abortEarly: true,
      },
    }),

    // ── CLS for Multi-Tenant Context ──
    ClsModule.forRoot({
      global: true,
      middleware: { 
        mount: true,
        setup: (cls, req) => {
          // Extract empresa_id from the validated token (set by JwtAuthGuard)
          // or from the x-empresa-id header for routes that don't use JwtAuthGuard (e.g. login)
          const empresaId = req.headers['x-empresa-id'];
          if (empresaId) {
            cls.set('empresa_id', empresaId);
          }
          // Note: If no empresa_id is provided, services that require it will 
          // get undefined and queries will return empty results (safe default).
          // This is intentional — no fallback UUID prevents data leakage.
        }
      },
    }),

    // ── Database — Credentials from Environment ──
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true', // Configurable for development
      }),
    }),

    // ── JWT — Global Module ──
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION') as any },
      }),
    }),

    // ── Feature Modules ──
    HealthModule,
    ReportesModule,
    CatalogoModule,
    SuperAdminModule,
    ComprasModule,
    UsuariosModule,
    EmpresasModule,
    ProveedoresModule,
    VentasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
