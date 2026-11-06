import { Injectable } from '@nestjs/common';
import * as z from 'zod/v4';
import { LlmBusyException, LlmClient, LlmResponse } from './llm.client';
import { LlmStep } from './llm-call.entity';
import { PipelineService, StepSetting } from './pipeline.service';
import {
  buildDescribeUserPrompt,
  buildScreeningUserPrompt,
  DescribeSystemPrompt,
  ScreeningSystemPrompt,
} from './roast.prompts';

const ScreeningSchema = z.object({
  suitable: z.boolean(),
  reason: z.string(),
});

const DescriptionSchema = z.object({ description: z.string() });

// The fields of an LlmCall that one request to the LLM determines
export interface LlmCallRecord {
  step: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

// What the product's own steps answer for an uploaded photo
export type PhotoAdmission =
  // `reason` is addressed to the uploader
  | { suitable: false; reason: string }
  // `records` are the requests of the screening and of the description
  | { suitable: true; description: string; records: LlmCallRecord[] };

interface Screening {
  suitable: boolean;
  // Addressed to the uploader; empty for a suitable photo
  reason: string;
  record: LlmCallRecord;
}

interface Description {
  text: string;
  record: LlmCallRecord;
}

const DeclinedReason = 'This photo cannot be roasted. Try another one.';

// The product's own steps before any voice's chain, each a request of its own on the model the admin set for it
// (PipelineService): the screening passes or rejects a photo, and the description is written once for a photo and
// kept on it, where every voice's chain reads it (ChainRunnerService)
@Injectable()
export class RoastService {
  constructor(
    private readonly llmClient: LlmClient,
    private readonly pipelineService: PipelineService,
  ) {}

  // Screens the photo and describes it. The 2 requests are made at once, so that the upload waits for the slower
  // one alone; the description of a photo the screening turns down is dropped.
  // `imageUrl` is the photo's public URL; `authorization` is the Authorization header of the uploader's request.
  async admit(
    imageUrl: string,
    place: string | null,
    authorization: string,
  ): Promise<PhotoAdmission> {
    const describing = this.describe(imageUrl, place, authorization);
    // The description's failure counts only for a photo the screening passes, where it is awaited below
    void describing.catch(() => undefined);

    const screening = await this.screen(imageUrl, place, authorization);
    if (!screening.suitable) {
      return { suitable: false, reason: screening.reason };
    }
    const description = await describing;
    return {
      suitable: true,
      description: description.text,
      records: [screening.record, description.record],
    };
  }

  private async screen(
    imageUrl: string,
    place: string | null,
    authorization: string,
  ): Promise<Screening> {
    const setting = await this.pipelineService.findStep(LlmStep.Screen);
    const userPrompt = buildScreeningUserPrompt(place);
    const response = await this.llmClient.generate({
      authorization,
      apiType: setting.apiType,
      model: setting.model,
      system: ScreeningSystemPrompt,
      user: userPrompt,
      imageUrl,
      schema: ScreeningSchema,
    });
    const record = this.toRecord(
      LlmStep.Screen,
      setting,
      ScreeningSystemPrompt,
      userPrompt,
      response,
    );

    // An answer without text is the model declining the photo
    if (!response.output) {
      return { suitable: false, reason: DeclinedReason, record };
    }
    const { suitable, reason } = response.output;
    return {
      suitable,
      reason: suitable ? '' : reason.trim() || DeclinedReason,
      record,
    };
  }

  private async describe(
    imageUrl: string,
    place: string | null,
    authorization: string,
  ): Promise<Description> {
    const setting = await this.pipelineService.findStep(LlmStep.Describe);
    const userPrompt = buildDescribeUserPrompt(place);
    const response = await this.llmClient.generate({
      authorization,
      apiType: setting.apiType,
      model: setting.model,
      system: DescribeSystemPrompt,
      user: userPrompt,
      imageUrl,
      schema: DescriptionSchema,
    });

    // The answer counts only for a photo the screening passes, for which one without text is the provider failing,
    // not a refusal
    if (!response.output) {
      throw new LlmBusyException();
    }
    const text = response.output.description.trim();
    if (!text) {
      throw new Error('LLM left the description of a suitable photo empty');
    }
    return {
      text,
      record: this.toRecord(
        LlmStep.Describe,
        setting,
        DescribeSystemPrompt,
        userPrompt,
        response,
      ),
    };
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
      systemPrompt,
      userPrompt,
      response: response.text,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      durationMs: response.durationMs,
    };
  }
}
