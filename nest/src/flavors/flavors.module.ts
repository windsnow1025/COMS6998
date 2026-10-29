import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caption } from '../captions/caption.entity';
import { CaptionExample } from './caption-example.entity';
import { FlavorsController } from './flavors.controller';
import { FlavorsService } from './flavors.service';
import { HumorFlavor } from './humor-flavor.entity';
import { Term } from './term.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HumorFlavor, Caption, Term, CaptionExample]),
  ],
  providers: [FlavorsService],
  controllers: [FlavorsController],
  exports: [FlavorsService],
})
export class FlavorsModule {}
