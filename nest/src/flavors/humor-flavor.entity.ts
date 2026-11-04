import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { PromptStep, StepOutput } from './prompt-step.entity';

// A voice in which captions are written: a prompt chain, whose steps (PromptStep) write a photo's caption in the voice
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

  // The voice's color in the product, as a hex triplet; empty only on a voice from before the column, until the first
  // start after its addition fills the seed color (FlavorsService)
  @Column({ type: 'varchar', length: 7, default: '' })
  color: string;

  @Column({ type: 'int' })
  position: number;

  // Whether new photos get a caption in the voice; the mix keeps at least CaptionsPerPhoto voices, and a voice in
  // the mix can write captions (ChainsService)
  @Column({ default: false })
  inMix: boolean;

  @OneToMany(() => PromptStep, (step) => step.flavor)
  steps: PromptStep[];
}

// Whether the chain can write a photo's captions: it ends with a step that answers captions
export function canWriteCaptions(steps: Pick<PromptStep, 'output'>[]): boolean {
  return (
    steps.length > 0 && steps[steps.length - 1].output === StepOutput.Captions
  );
}
