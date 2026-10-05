import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

// A voice in which captions are written
@Entity()
export class HumorFlavor extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'varchar', length: 160 })
  tagline: string;

  // The voice instruction given to the LLM
  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'int' })
  position: number;
}
