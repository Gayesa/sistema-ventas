import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ProductoVariante } from './producto-variante.entity';
import { Categoria } from './categoria.entity';
import { InventarioLote } from '../../inventario/entities/inventario-lote.entity';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'uuid', nullable: true })
  categoria_id: string;

  @Column({ type: 'uuid', nullable: true })
  proveedor_id: string;

  @Column({ type: 'varchar', length: 50, default: 'Unidad' })
  unidad_medida: string;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @Column({ type: 'boolean', default: false })
  es_compuesto: boolean;

  @Column({ type: 'text', nullable: true })
  imagen_url: string;

  @Column({ type: 'boolean', default: false })
  controla_lotes: boolean;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  stock_total: number;

  @OneToMany(() => ProductoVariante, (variante) => variante.producto)
  variantes: ProductoVariante[];

  @OneToMany(() => InventarioLote, (lote) => lote.producto)
  lotes: InventarioLote[];

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
