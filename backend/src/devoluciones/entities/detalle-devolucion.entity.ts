import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class DetalleDevolucion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() devolucion_id: string;
}
