import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Image } from '../images/image.entity';
import { DailyBatch } from './daily-batch.entity';

@Entity()
@Unique(['batch', 'position'])
@Unique(['batch', 'image'])
export class DailyBatchItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DailyBatch, (batch) => batch.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  batch: DailyBatch;

  // A photo is served once per batch; a later batch serves a photo again while it has no verdict
  @ManyToOne(() => Image, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  image: Image;

  @Column({ type: 'int' })
  position: number;

  // Added after the batch opened, once its new photos fell short; the streak's requirement leaves such a photo out
  @Column({ default: false })
  lateAddition: boolean;
}
