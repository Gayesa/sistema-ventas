import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Venta } from './venta.entity';

@Entity('detalles_venta')
export class DetalleVenta {
  @PrimaryGeneratedColumn('uuid') id: string;
  
  @Column({ type: 'uuid' }) venta_id: string;
  @ManyToOne(() => Venta, venta => venta.detalles)
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @Column({ type: 'uuid', nullable: true }) variante_id: string;
  @Column({ type: 'varchar' }) nombre_producto: string;
  @Column({ type: 'uuid', nullable: true }) producto_id: string;
  @Column({ type: 'int' }) cantidad: number;
  @Column({ type: 'decimal', precision: 10, scale: 2 }) precio_unitario: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) precio_venta: number;
  @Column({ type: 'decimal', precision: 10, scale: 2 }) subtotal: number;
}
