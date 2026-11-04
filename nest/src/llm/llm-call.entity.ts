import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChainRun } from '../flavors/chain-run.entity';
import { HumorFlavor } from '../flavors/humor-flavor.entity';
import { MaxStepNameLength } from '../flavors/prompt-step.entity';
import { Image } from '../images/image.entity';
import { User } from '../users/user.entity';

// The product's own step before any chain: the photo's screening and description
export enum LlmStep {
  Describe = 'describe',
}

// One request to the LLM, with the prompts sent and the response received
@Entity()
export class LlmCall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Image, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  image: Image;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  user: User | null;

  // The voice whose chain step made the request; null for the screening
  @ManyToOne(() => HumorFlavor, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  flavor: HumorFlavor | null;

  // The chain tool's run the request belongs to; null for the product's own generation
  @ManyToOne(() => ChainRun, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  run: ChainRun | null;

  // The screening (LlmStep) or the name of the chain step
  @Column({ type: 'varchar', length: MaxStepNameLength })
  step: string;

  @Column({ type: 'varchar', length: 64 })
  model: string;

  // The temperature the request was made with; null for a request from before it was recorded
  @Column({ type: 'real', nullable: true })
  temperature: number | null;

  @Column({ type: 'text' })
  systemPrompt: string;

  @Column({ type: 'text' })
  userPrompt: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ type: 'int' })
  inputTokens: number;

  @Column({ type: 'int' })
  outputTokens: number;

  @Column({ type: 'int' })
  durationMs: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
