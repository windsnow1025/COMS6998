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

// The product's own steps before any chain: the photo's screening and its description
export enum LlmStep {
  Screen = 'screen',
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

  // The voice whose chain step made the request; null for the product's own steps
  @ManyToOne(() => HumorFlavor, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  flavor: HumorFlavor | null;

  // The chain tool's run the request belongs to; null for the product's own generation
  @ManyToOne(() => ChainRun, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  run: ChainRun | null;

  // One of the product's own steps (LlmStep) or the name of the chain step
  @Column({ type: 'varchar', length: MaxStepNameLength })
  step: string;

  @Column({ type: 'varchar', length: 64 })
  model: string;

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
