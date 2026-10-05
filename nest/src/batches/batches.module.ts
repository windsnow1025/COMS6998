import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../core/core.module';
import { ImagesModule } from '../images/images.module';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';
import { DailyBatchItem } from './daily-batch-item.entity';
import { DailyBatch } from './daily-batch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyBatch, DailyBatchItem]),
    JwtModule,
    CoreModule,
    ImagesModule,
  ],
  providers: [BatchesService],
  controllers: [BatchesController],
  exports: [BatchesService],
})
export class BatchesModule {}
