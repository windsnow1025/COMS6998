import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmStep } from './llm-call.entity';
import { LlmModel } from './llm-model.entity';
import { LlmProvider } from './llm-provider.entity';
import {
  CaptionApiType,
  CaptionModel,
  DescribeApiType,
  DescribeModel,
  Temperature,
} from './llm.constants';
import { PipelineStep } from './pipeline-step.entity';

// What one call to a step is made with
export interface StepSetting {
  apiType: string;
  model: string;
  temperature: number;
}

@Injectable()
export class PipelineService implements OnModuleInit {
  constructor(
    @InjectRepository(LlmProvider)
    private readonly providerRepository: Repository<LlmProvider>,
    @InjectRepository(LlmModel)
    private readonly modelRepository: Repository<LlmModel>,
    @InjectRepository(PipelineStep)
    private readonly stepRepository: Repository<PipelineStep>,
  ) {}

  // Seeds the steps from the code's constants while the table is empty; the admin owns them afterwards
  async onModuleInit() {
    if ((await this.stepRepository.count()) > 0) {
      return;
    }
    const seeds: [LlmStep, string, string][] = [
      [LlmStep.Describe, DescribeApiType, DescribeModel],
      [LlmStep.Caption, CaptionApiType, CaptionModel],
    ];
    for (const [step, apiType, name] of seeds) {
      const model = await this.ensureModel(apiType, name);
      await this.stepRepository.save({ step, model, temperature: Temperature });
    }
  }

  // The provider, the model, and the temperature of a step, read at each call so that the admin's changes apply at once
  async findStep(step: LlmStep): Promise<StepSetting> {
    const row = await this.stepRepository.findOne({
      where: { step },
      relations: { model: { provider: true } },
    });
    if (!row) {
      throw new Error(`The pipeline step "${step}" is not configured`);
    }
    return {
      apiType: row.model.provider.apiType,
      model: row.model.name,
      temperature: row.temperature,
    };
  }

  private async ensureModel(apiType: string, name: string): Promise<LlmModel> {
    const provider =
      (await this.providerRepository.findOneBy({ apiType })) ??
      (await this.providerRepository.save({ name: apiType, apiType }));
    return (
      (await this.modelRepository.findOne({
        where: { provider: { id: provider.id }, name },
      })) ?? (await this.modelRepository.save({ provider, name }))
    );
  }
}
