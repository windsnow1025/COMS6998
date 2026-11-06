import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { LlmStep } from './llm-call.entity';
import { LlmModel } from './llm-model.entity';

// One of the product's own steps with the model it runs on; read at every call
@Entity()
export class PipelineStep extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  step: LlmStep;

  // A model a step runs on cannot be deleted
  @ManyToOne(() => LlmModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn()
  model: LlmModel;
}
