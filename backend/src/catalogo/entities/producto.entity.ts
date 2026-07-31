import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ProductoVariante } from './producto-variante.entity';
import { Categoria } from './categoria.entity';

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

  @OneToMany(() => ProductoVariante, (variante) => variante.producto)
  variantes: ProductoVariante[];

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
