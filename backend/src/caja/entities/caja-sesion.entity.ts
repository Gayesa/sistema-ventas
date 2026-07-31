import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CajaSesion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() empresa_id: string;
  @Column() estado: string;
  @Column() usuario_id: string;
  @Column({ nullable: true }) saldo_actual: number;
}
