import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { DetalleVenta } from './detalle-venta.entity';

@Entity('ventas')
export class Venta {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) empresa_id: string;
  @Column({ type: 'varchar' }) numero_ticket: string;
  @Column({ type: 'varchar' }) metodo_pago: string;
  @Column({ type: 'decimal', precision: 10, scale: 2 }) total: number;
  @CreateDateColumn() fecha: Date;
  @Column({ type: 'varchar', default: 'COMPLETADA' }) estado: string;
  @Column({ type: 'varchar', nullable: true }) vendedor: string;
  @Column({ type: 'jsonb', nullable: true }) pagos_detalle: any;
  @Column({ type: 'uuid', nullable: true }) cliente_id: string;
  @Column({ type: 'jsonb', nullable: true }) cliente_datos: any;

  @OneToMany(() => DetalleVenta, detalle => detalle.venta, { cascade: true })
  detalles: DetalleVenta[];
}
