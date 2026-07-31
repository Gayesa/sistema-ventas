import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { AtributoValor } from './atributo-valor.entity';

@Entity('atributos_globales')
export class AtributoGlobal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  empresa_id: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @OneToMany(() => AtributoValor, (valor) => valor.atributo, { cascade: true })
  valores: AtributoValor[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
