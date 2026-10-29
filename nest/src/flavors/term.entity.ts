import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

// A word of the audience's vernacular, given to the caption step to use where a photo calls for it
@Entity()
export class Term extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  term: string;

  @Column({ type: 'text' })
  meaning: string;

  // A sentence that uses the term
  @Column({ type: 'text', nullable: true })
  example: string | null;
}
