import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmStep } from './llm-call.entity';
import { LlmModel } from './llm-model.entity';
import { LlmProvider } from './llm-provider.entity';
import { PipelineApiType, PipelineModel } from './llm.constants';
import { PipelineStep } from './pipeline-step.entity';

// What one call to a step is made with
export interface StepSetting {
  apiType: string;
  model: string;
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

  // Seeds each of the product's own steps from the code's constants while the table lacks it; the admin owns it
  // afterwards
  async onModuleInit() {
    for (const step of Object.values(LlmStep)) {
      if (await this.stepRepository.existsBy({ step })) {
        continue;
      }
      const model = await this.ensureModel(PipelineApiType, PipelineModel);
      await this.stepRepository.save({ step, model });
    }
  }

  // The provider and the model of a step, read at each call so that the admin's changes apply at once
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
    };
  }

  // The model of the name under the provider of the API type, each created when missing
  async ensureModel(apiType: string, name: string): Promise<LlmModel> {
    const provider =
      (await this.providerRepository.findOneBy({ apiType })) ??
      (await this.providerRepository.save({ apiType }));
    return (
      (await this.modelRepository.findOne({
        where: { provider: { id: provider.id }, name },
        relations: { provider: true },
      })) ?? (await this.modelRepository.save({ provider, name }))
    );
  }
}
