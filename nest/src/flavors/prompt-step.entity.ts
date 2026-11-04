import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { LlmModel } from '../llm/llm-model.entity';
import { HumorFlavor } from './humor-flavor.entity';

// What a step looks at beside its prompts: the photo itself, or text alone
export enum StepInput {
  Image = 'image',
  Text = 'text',
}

// The form of a step's answer: free text, or a list of captions
export enum StepOutput {
  Text = 'text',
  Captions = 'captions',
}

export const MaxStepNameLength = 16;
export const MaxPromptLength = 20000;

// One request to the LLM in a voice's prompt chain, run in the chain's order; its prompts carry placeholders
// (ChainRunnerService) that the photo's parts and the previous step's answer fill at each run
@Entity()
@Unique(['flavor', 'position'])
export class PromptStep extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => HumorFlavor, (flavor) => flavor.steps, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  flavor: HumorFlavor;

  // The step's place in the chain, from 0
  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'varchar', length: MaxStepNameLength })
  name: string;

  @Column({ type: 'varchar', length: 8 })
  input: StepInput;

  @Column({ type: 'varchar', length: 8 })
  output: StepOutput;

  @Column({ type: 'text' })
  systemPrompt: string;

  @Column({ type: 'text' })
  userPrompt: string;

  // A model a step runs on cannot be deleted
  @ManyToOne(() => LlmModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn()
  model: LlmModel;

  @Column({ type: 'real', default: 1 })
  temperature: number;
}
