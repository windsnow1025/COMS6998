import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Caption } from '../captions/caption.entity';
import { Image } from '../images/image.entity';
import { User } from '../users/user.entity';

export const VoteValue = {
  Up: 1,
  Down: -1,
};

// A user's verdict on one caption.
// Picking a caption is one Up row; rejecting every caption of a photo is one Down row per caption.
@Entity()
@Unique(['user', 'caption'])
@Index(['user', 'image'], { unique: true, where: '"value" = 1' })
@Check('"value" IN (-1, 1)')
export class CaptionVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Caption, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  caption: Caption;

  // The caption's image, repeated here so that the database allows one pick per user and image
  @Index()
  @ManyToOne(() => Image, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  image: Image;

  @Column({ type: 'smallint' })
  value: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
