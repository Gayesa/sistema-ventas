import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Devolucion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() empresa_id: string;
}
