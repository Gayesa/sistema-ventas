import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DetalleCompra } from './detalle-compra.entity';

@Entity()
export class Compra {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() empresa_id: string;
  @Column() proveedor_id: string;
  @Column() numero_factura_proveedor: string;
  @Column() fecha_compra: Date;
  @Column() total_compra: number;

  @OneToMany(() => DetalleCompra, (detalle) => detalle.compra)
  detalles: DetalleCompra[];
}
