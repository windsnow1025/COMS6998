import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { HumorFlavor } from '../flavors/humor-flavor.entity';
import { Image } from '../images/image.entity';
import { LlmCall } from '../llm/llm-call.entity';

@Entity()
@Unique(['image', 'flavor'])
export class Caption extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Image, (image) => image.captions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  image: Image;

  // The voice the caption is written in; null for a caption that no LLM wrote
  @ManyToOne(() => HumorFlavor, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  flavor: HumorFlavor | null;

  // The request that generated the caption, which holds its prompts
  @ManyToOne(() => LlmCall, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  llmCall: LlmCall | null;
}
