import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { MaxCaptionLength } from '../llm/llm.constants';
import { HumorFlavor } from './humor-flavor.entity';

// A caption in a voice with the photo description it was written for, shown to the caption step as a further example of the voice
@Entity()
export class CaptionExample extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => HumorFlavor, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  flavor: HumorFlavor;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: MaxCaptionLength })
  caption: string;
}
