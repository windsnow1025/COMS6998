import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Image } from '../images/image.entity';
import { DailyBatch } from './daily-batch.entity';

@Entity()
@Unique(['batch', 'position'])
export class DailyBatchItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DailyBatch, (batch) => batch.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  batch: DailyBatch;

  // One-to-one: a photo is served in one batch only
  @OneToOne(() => Image, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  image: Image;

  @Column({ type: 'int' })
  position: number;
}
