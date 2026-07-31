import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Producto } from './producto.entity';

@Entity('producto_variantes')
@Unique(['empresa_id', 'sku'])
export class ProductoVariante {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @Column({ type: 'uuid' })
  producto_id: string;

  @ManyToOne(() => Producto, (producto) => producto.variantes)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio_compra: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precio_venta: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stock_actual: number;

  @Column('decimal', { precision: 10, scale: 2, default: 10 })
  stock_minimo: number;

  @Column({ type: 'jsonb', nullable: true })
  atributos: Record<string, any> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rentabilidad_mensaje: string;
}
