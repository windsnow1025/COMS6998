import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caption } from './caption.entity';
import { CaptionsService } from './captions.service';
import { CaptionsController } from './captions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Caption])],
  providers: [CaptionsService],
  controllers: [CaptionsController],
  exports: [],
})
export class CaptionsModule {}
