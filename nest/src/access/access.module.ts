import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessPolicy } from './access-policy.entity';
import { AccessService } from './access.service';
import { AllowedDomain } from './allowed-domain.entity';
import { WhitelistedEmail } from './whitelisted-email.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AllowedDomain, WhitelistedEmail, AccessPolicy]),
  ],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
