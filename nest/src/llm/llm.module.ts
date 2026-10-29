import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounterClient } from './counter.client';
import { LlmClient } from './llm.client';
import { LlmModel } from './llm-model.entity';
import { LlmProvider } from './llm-provider.entity';
import { PipelineStep } from './pipeline-step.entity';
import { PipelineService } from './pipeline.service';
import { RoastQuotaService } from './roast-quota.service';
import { RoastService } from './roast.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([LlmProvider, LlmModel, PipelineStep]),
  ],
  providers: [
    LlmClient,
    CounterClient,
    PipelineService,
    RoastService,
    RoastQuotaService,
  ],
  exports: [RoastService, RoastQuotaService, PipelineService],
})
export class LlmModule {}
