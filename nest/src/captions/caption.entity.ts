import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Image } from '../images/image.entity';

@Entity()
export class Caption extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Image, (image) => image.captions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  image: Image;
}
