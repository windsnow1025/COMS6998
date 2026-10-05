import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caption } from '../captions/caption.entity';
import { FlavorsController } from './flavors.controller';
import { FlavorsService } from './flavors.service';
import { HumorFlavor } from './humor-flavor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HumorFlavor, Caption])],
  providers: [FlavorsService],
  controllers: [FlavorsController],
  exports: [FlavorsService],
})
export class FlavorsModule {}
