import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AtributoGlobal } from './atributo-global.entity';

@Entity('atributos_valores')
export class AtributoValor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  atributo_id: string;

  @ManyToOne(() => AtributoGlobal, (atributo) => atributo.valores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'atributo_id' })
  atributo: AtributoGlobal;

  @Column({ type: 'varchar', length: 150 })
  valor: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
