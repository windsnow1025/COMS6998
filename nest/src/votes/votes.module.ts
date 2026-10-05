import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptionVote } from './caption-vote.entity';
import { VotesService } from './votes.service';

@Module({
  imports: [TypeOrmModule.forFeature([CaptionVote])],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
