import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AuditoriaAccion {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Entity('auditoria_logs')
export class AuditoriaLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Indizado para que el ADMIN_TIENDA cargue rápidamente la auditoría solo de su tenant
  @Index()
  @Column({ type: 'uuid' })
  empresa_id: string;

  @Column({ type: 'uuid' })
  usuario_id: string;

  @Column({ type: 'enum', enum: AuditoriaAccion })
  accion: AuditoriaAccion;

  @Column({ type: 'varchar', length: 150 })
  tabla_afectada: string;

  @Column({ type: 'varchar', length: 150 })
  registro_id: string;

  // JSONB nativo de PostgreSQL permite estructurar y buscar ágilmente en el payload
  @Column({ type: 'jsonb', nullable: true })
  valores_anteriores: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  valores_nuevos: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  direccion_ip: string;
}
