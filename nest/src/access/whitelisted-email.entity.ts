import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

// An email address that may create an account whatever its domain (AccessService)
@Entity()
export class WhitelistedEmail extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Lower case
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;
}
