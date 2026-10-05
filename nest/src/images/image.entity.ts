import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Caption } from '../captions/caption.entity';
import { User } from '../users/user.entity';

@Entity()
export class Image extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text' })
  description: string;

  // The uploader's note on where the photo was taken
  @Column({ type: 'varchar', length: 80, nullable: true })
  place: string | null;

  // The object's key in storage; null for an image hosted elsewhere
  @Column({ type: 'text', nullable: true })
  storageKey: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  uploader: User | null;

  @OneToMany(() => Caption, (caption) => caption.image)
  captions: Caption[];
}
