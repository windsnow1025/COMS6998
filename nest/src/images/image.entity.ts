import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Caption } from '../captions/caption.entity';

@Entity()
export class Image extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text' })
  description: string;

  @OneToMany(() => Caption, (caption) => caption.image)
  captions: Caption[];
}
