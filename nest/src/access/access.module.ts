import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessService } from './access.service';
import { AllowedDomain } from './allowed-domain.entity';
import { WhitelistedEmail } from './whitelisted-email.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AllowedDomain, WhitelistedEmail])],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
