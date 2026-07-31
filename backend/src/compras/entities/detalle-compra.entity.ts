import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Compra } from './compra.entity';
import { ProductoVariante } from '../../catalogo/entities/producto-variante.entity';

@Entity()
export class DetalleCompra {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() compra_id: string;
  @Column() producto_id: string;
  @Column() cantidad: number;
  @Column() costo_unitario: number;
  @Column() subtotal: number;

  @ManyToOne(() => Compra, (compra) => compra.detalles)
  @JoinColumn({ name: 'compra_id' })
  compra: Compra;

  @ManyToOne(() => ProductoVariante)
  @JoinColumn({ name: 'producto_id' })
  producto: ProductoVariante;
}
