import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class MovimientoInventario {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() empresa_id: string;
  @Column() producto_id: string;
  @Column() tipo_movimiento: string;
  @Column() motivo: string;
  @Column() cantidad: number;
  @Column() referencia_id: string;
}
