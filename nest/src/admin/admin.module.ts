import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyBatch } from '../batches/daily-batch.entity';
import { DailyBatchItem } from '../batches/daily-batch-item.entity';
import { Caption } from '../captions/caption.entity';
import { HumorFlavor } from '../flavors/humor-flavor.entity';
import { Image } from '../images/image.entity';
import { ImagesModule } from '../images/images.module';
import { LlmCall } from '../llm/llm-call.entity';
import { User } from '../users/user.entity';
import { CaptionVote } from '../votes/caption-vote.entity';
import { VotesModule } from '../votes/votes.module';
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
    ]),
    ImagesModule,
    VotesModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
