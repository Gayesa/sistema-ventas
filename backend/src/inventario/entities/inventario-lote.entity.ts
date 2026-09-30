import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Producto } from '../../catalogo/entities/producto.entity';

@Entity('inventario_lotes')
@Index(['empresa_id', 'producto_id'])
@Index(['empresa_id', 'fecha_vencimiento'])
@Index(['producto_id', 'fecha_vencimiento'])
export class InventarioLote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  empresa_id: string;

  @Index()
  @Column({ type: 'uuid' })
  producto_id: string;

  @ManyToOne(() => Producto, (producto) => producto.lotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({ type: 'varchar', length: 100, nullable: true })
  numero_lote?: string;

  @Index()
  @Column({ type: 'date' })
  fecha_vencimiento: Date;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  stock_actual: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
