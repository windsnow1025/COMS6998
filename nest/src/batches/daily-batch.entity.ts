import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { DailyBatchItem } from './daily-batch-item.entity';

// The photos served to everyone on one campus date
@Entity()
export class DailyBatch extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', unique: true })
  date: string;

  @OneToMany(() => DailyBatchItem, (item) => item.batch)
  items: DailyBatchItem[];
}
