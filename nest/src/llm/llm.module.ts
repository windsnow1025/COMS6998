import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CounterClient } from './counter.client';
import { LlmClient } from './llm.client';
import { RoastQuotaService } from './roast-quota.service';
import { RoastService } from './roast.service';

@Module({
  imports: [ConfigModule],
  providers: [LlmClient, CounterClient, RoastService, RoastQuotaService],
  exports: [RoastService, RoastQuotaService],
})
export class LlmModule {}
