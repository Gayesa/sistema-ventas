import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Check } from 'typeorm';
import { ProductoVariante } from './producto-variante.entity';

@Entity('receta_detalles')
@Check(`"variante_combo_id" != "variante_ingrediente_id"`) // Evita que un combo sea ingrediente de sí mismo
export class RecetaDetalle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  variante_combo_id: string;

  @ManyToOne(() => ProductoVariante)
  @JoinColumn({ name: 'variante_combo_id' })
  varianteCombo: ProductoVariante;

  @Column({ type: 'uuid' })
  variante_ingrediente_id: string;

  @ManyToOne(() => ProductoVariante)
  @JoinColumn({ name: 'variante_ingrediente_id' })
  varianteIngrediente: ProductoVariante;

  @Column('decimal', { precision: 10, scale: 3 })
  cantidad_requerida: number;
}
