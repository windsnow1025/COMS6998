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

export enum LlmStep {
  Describe = 'describe',
  Caption = 'caption',
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

  @Column({ type: 'varchar', length: 16 })
  step: LlmStep;

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
