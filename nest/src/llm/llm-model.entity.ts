import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { LlmProvider } from './llm-provider.entity';

// A model of a provider, named as FastAPI's /chat takes it
@Entity()
@Unique(['provider', 'name'])
export class LlmModel extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LlmProvider, (provider) => provider.models, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  provider: LlmProvider;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  // Whether a pipeline step may be set to the model
  @Column({ default: true })
  enabled: boolean;
}
