import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('movimiento_inventario')
export class MovimientoInventario {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() empresa_id: string;
  @Column() producto_id: string;
  @Column() tipo_movimiento: string;
  @Column() motivo: string;
  @Column() cantidad: number;
  @Column() referencia_id: string;
}
