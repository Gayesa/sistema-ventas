import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Empresa {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() nombre: string;
  @Column({ nullable: true }) documento: string;
  @Column({ nullable: true }) telefono: string;
  @Column({ nullable: true }) direccion: string;
  @Column({ nullable: true }) correo: string;
  @Column({ type: 'text', nullable: true }) logo: string;
  @Column({ nullable: true }) fecha_vencimiento_suscripcion: Date;
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) fecha_creacion: Date;
}
