import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Image } from '../images/image.entity';
import { User } from '../users/user.entity';
import { HumorFlavor } from './humor-flavor.entity';
import { StepOutput } from './prompt-step.entity';

export enum RunStatus {
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

// A run of a voice's chain on a photo from the chain tool, whose answer is kept here and not as the photo's captions;
// each step's request is an LlmCall of the run
@Entity()
export class ChainRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => HumorFlavor, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  flavor: HumorFlavor;

  @ManyToOne(() => Image, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  image: Image;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  user: User | null;

  @Column({ type: 'varchar', length: 16 })
  status: RunStatus;

  // The form of the final step's answer when the run started
  @Column({ type: 'varchar', length: 8 })
  outputType: StepOutput;

  // The chain's step count when the run started, which the run's progress reads against
  @Column({ type: 'int' })
  stepCount: number;

  // The final step's answer: the text, or the captions as a JSON array; empty until the run succeeds
  @Column({ type: 'text', default: '' })
  output: string;

  // Why the run failed; null otherwise
  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;
}
