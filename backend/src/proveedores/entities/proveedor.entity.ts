import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('proveedores')
export class Proveedor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @Column({ length: 255 })
  razon_social: string;

  @Column({ length: 255 })
  documento: string;

  @Column({ length: 255, nullable: true })
  contacto_nombre: string;

  @Column({ length: 255, nullable: true })
  telefono_principal: string;

  @Column({ length: 255, nullable: true })
  telefono_alternativo: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 255, nullable: true })
  direccion: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
