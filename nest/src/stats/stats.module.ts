import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyBatch } from '../batches/daily-batch.entity';
import { FlavorsModule } from '../flavors/flavors.module';
import { Image } from '../images/image.entity';
import { LlmModule } from '../llm/llm.module';
import { VotesModule } from '../votes/votes.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyBatch, Image]),
    FlavorsModule,
    LlmModule,
    VotesModule,
  ],
  providers: [StatsService],
  controllers: [StatsController],
  exports: [],
})
export class StatsModule {}
