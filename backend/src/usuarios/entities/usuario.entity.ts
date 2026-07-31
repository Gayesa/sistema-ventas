import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() empresa_id: string;
  @Column({ nullable: true }) nombre: string;
  @Column({ nullable: true }) email: string;
  @Column({ nullable: true }) password?: string;
  @Column({ nullable: true }) rol?: string;
}
