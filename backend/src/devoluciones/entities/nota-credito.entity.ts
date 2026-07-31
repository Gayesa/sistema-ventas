import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class NotaCredito {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() empresa_id: string;
  @Column() venta_id: string;
  @Column() monto_total: number;
  @Column() fecha_emision: Date;
  @Column() metodo_reembolso: string;
}
