import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

// An email domain whose addresses may create an account (AccessService)
@Entity()
export class AllowedDomain extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Lower case, without the "@"
  @Column({ type: 'varchar', length: 255, unique: true })
  domain: string;
}
