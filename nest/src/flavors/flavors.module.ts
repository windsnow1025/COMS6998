import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caption } from '../captions/caption.entity';
import { Image } from '../images/image.entity';
import { LlmCall } from '../llm/llm-call.entity';
import { LlmModel } from '../llm/llm-model.entity';
import { LlmModule } from '../llm/llm.module';
import { PipelineStep } from '../llm/pipeline-step.entity';
import { CaptionExample } from './caption-example.entity';
import { ChainRun } from './chain-run.entity';
import { ChainRunnerService } from './chain-runner.service';
import { ChainsController } from './chains.controller';
import { ChainsService } from './chains.service';
import { FlavorsController } from './flavors.controller';
import { FlavorsService } from './flavors.service';
import { HumorFlavor } from './humor-flavor.entity';
import { PromptStep } from './prompt-step.entity';
import { Term } from './term.entity';
import { CaptionVote } from '../votes/caption-vote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HumorFlavor,
      PromptStep,
      ChainRun,
      Caption,
      CaptionVote,
      Term,
      CaptionExample,
      LlmCall,
      LlmModel,
      PipelineStep,
      Image,
    ]),
    LlmModule,
  ],
  providers: [FlavorsService, ChainsService, ChainRunnerService],
  controllers: [FlavorsController, ChainsController],
  exports: [FlavorsService, ChainsService, ChainRunnerService],
})
export class FlavorsModule {}
