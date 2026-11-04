import { Injectable } from '@nestjs/common';
import * as z from 'zod/v4';
import { LlmClient, LlmResponse } from './llm.client';
import { LlmStep } from './llm-call.entity';
import { PipelineService, StepSetting } from './pipeline.service';
import { buildDescribeUserPrompt, DescribeSystemPrompt } from './roast.prompts';

const DescriptionSchema = z.object({
  suitable: z.boolean(),
  reason: z.string(),
  description: z.string(),
});

// The fields of an LlmCall that one request to the LLM determines
export interface LlmCallRecord {
  step: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

export interface PhotoScreening {
  suitable: boolean;
  // Addressed to the uploader; empty for a suitable photo
  reason: string;
  description: string;
  record: LlmCallRecord;
}

const DeclinedReason = 'This photo cannot be roasted. Try another one.';

// The product's own step before any voice's chain: a photo is screened and described, on the model and the
// temperature the admin set for the screening (PipelineService); the voices' chains then write from the description
// (ChainRunnerService)
@Injectable()
export class RoastService {
  constructor(
    private readonly llmClient: LlmClient,
    private readonly pipelineService: PipelineService,
  ) {}

  // `imageUrl` is the photo's public URL; `authorization` is the Authorization header of the uploader's request.
  async screen(
    imageUrl: string,
    place: string | null,
    authorization: string,
  ): Promise<PhotoScreening> {
    const setting = await this.pipelineService.findStep(LlmStep.Describe);
    const userPrompt = buildDescribeUserPrompt(place);
    const response = await this.llmClient.generate({
      authorization,
      apiType: setting.apiType,
      model: setting.model,
      temperature: setting.temperature,
      system: DescribeSystemPrompt,
      user: userPrompt,
      imageUrl,
      schema: DescriptionSchema,
    });
    const record = this.toRecord(
      LlmStep.Describe,
      setting,
      DescribeSystemPrompt,
      userPrompt,
      response,
    );

    if (!response.output) {
      return {
        suitable: false,
        reason: DeclinedReason,
        description: '',
        record,
      };
    }

    const { suitable, reason, description } = response.output;
    if (!suitable) {
      return {
        suitable,
        reason: reason.trim() || DeclinedReason,
        description: '',
        record,
      };
    }
    if (!description.trim()) {
      throw new Error('LLM left the description of a suitable photo empty');
    }
    return { suitable, reason: '', description: description.trim(), record };
  }

  private toRecord(
    step: string,
    setting: StepSetting,
    systemPrompt: string,
    userPrompt: string,
    response: LlmResponse<unknown>,
  ): LlmCallRecord {
    return {
      step,
      model: setting.model,
      temperature: setting.temperature,
      systemPrompt,
      userPrompt,
      response: response.text,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      durationMs: response.durationMs,
    };
  }
}
