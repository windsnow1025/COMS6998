import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

export const SignUpPolicyId = 'sign-up';

// Whether sign-up is limited to the listed domains and addresses; one row, `SignUpPolicyId`, seeded off
@Entity()
export class AccessPolicy extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  id: string;

  @Column({ default: false })
  restricted: boolean;
}
