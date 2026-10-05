import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyBatchItem } from '../batches/daily-batch-item.entity';
import { CoreModule } from '../core/core.module';
import { FilesModule } from '../files/files.module';
import { FlavorsModule } from '../flavors/flavors.module';
import { LlmModule } from '../llm/llm.module';
import { VotesModule } from '../votes/votes.module';
import { Image } from './image.entity';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { PhotosService } from './photos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Image, DailyBatchItem]),
    JwtModule,
    CoreModule,
    FilesModule,
    FlavorsModule,
    LlmModule,
    VotesModule,
  ],
  providers: [ImagesService, PhotosService],
  controllers: [ImagesController],
  exports: [ImagesService, PhotosService],
})
export class ImagesModule {}
