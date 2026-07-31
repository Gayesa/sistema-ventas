import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity'; // Asegúrate de que esta ruta sea correcta según tu proyecto

export enum MetodoPago {
  EFECTIVO = 'Efectivo',
  TRANSFERENCIA = 'Transferencia',
  TARJETA = 'Tarjeta',
}

@Entity('pagos_suscripcion')
export class PagoSuscripcion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_pago: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'enum', enum: MetodoPago })
  metodo_pago: MetodoPago;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia: string;
}
