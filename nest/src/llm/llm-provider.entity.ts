import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { LlmModel } from './llm-model.entity';

// A company whose models FastAPI calls, known by its API type; its API key stays in FastAPI's secret
@Entity()
export class LlmProvider extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The `api_type` that FastAPI's /chat takes for the provider, as its model list names it
  @Column({ type: 'varchar', length: 64, unique: true })
  apiType: string;

  // Whether a pipeline step may be set to one of its models
  @Column({ default: true })
  enabled: boolean;

  @OneToMany(() => LlmModel, (model) => model.provider)
  models: LlmModel[];
}
