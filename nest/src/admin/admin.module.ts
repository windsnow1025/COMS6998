import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessModule } from '../access/access.module';
import { DailyBatch } from '../batches/daily-batch.entity';
import { DailyBatchItem } from '../batches/daily-batch-item.entity';
import { Caption } from '../captions/caption.entity';
import { CaptionExample } from '../flavors/caption-example.entity';
import { FlavorsModule } from '../flavors/flavors.module';
import { HumorFlavor } from '../flavors/humor-flavor.entity';
import { Term } from '../flavors/term.entity';
import { Image } from '../images/image.entity';
import { ImagesModule } from '../images/images.module';
import { LlmCall } from '../llm/llm-call.entity';
import { LlmModel } from '../llm/llm-model.entity';
import { LlmProvider } from '../llm/llm-provider.entity';
import { PipelineStep } from '../llm/pipeline-step.entity';
import { User } from '../users/user.entity';
import { CaptionVote } from '../votes/caption-vote.entity';
import { VotesModule } from '../votes/votes.module';
import { AdminConfigController } from './admin-config.controller';
import { AdminConfigService } from './admin-config.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Image,
      Caption,
      CaptionVote,
      LlmCall,
      HumorFlavor,
      DailyBatch,
      DailyBatchItem,
      Term,
      CaptionExample,
      LlmProvider,
      LlmModel,
      PipelineStep,
    ]),
    ImagesModule,
    VotesModule,
    FlavorsModule,
    AccessModule,
  ],
  providers: [AdminService, AdminConfigService],
  controllers: [AdminController, AdminConfigController],
})
export class AdminModule {}
