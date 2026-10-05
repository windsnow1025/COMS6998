import { Injectable } from '@nestjs/common';
import * as z from 'zod/v4';
import { HumorFlavor } from '../flavors/humor-flavor.entity';
import { LlmBusyException, LlmClient, LlmResponse } from './llm.client';
import { LlmStep } from './llm-call.entity';
import {
  CaptionApiType,
  CaptionModel,
  DescribeApiType,
  DescribeModel,
  MaxCaptionLength,
} from './llm.constants';
import {
  buildCaptionSystemPrompt,
  buildCaptionUserPrompt,
  buildDescribeUserPrompt,
  DescribeSystemPrompt,
} from './roast.prompts';

const DescriptionSchema = z.object({
  suitable: z.boolean(),
  reason: z.string(),
  description: z.string(),
});

const CaptionsSchema = z.object({
  captions: z.array(z.object({ voice: z.string(), text: z.string() })),
});

// The fields of an LlmCall that one request to the LLM determines
export interface LlmCallRecord {
  step: LlmStep;
  model: string;
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

export interface WrittenCaption {
  flavor: HumorFlavor;
  text: string;
}

export interface WrittenCaptions {
  captions: WrittenCaption[];
  record: LlmCallRecord;
}

const DeclinedReason = 'This photo cannot be roasted. Try another one.';

// The prompt chain: a photo is described, and the description is captioned.
@Injectable()
export class RoastService {
  constructor(private readonly llmClient: LlmClient) {}

  // `imageUrl` is the photo's public URL; `authorization` is the Authorization header of the uploader's request.
  async screen(
    imageUrl: string,
    place: string | null,
    authorization: string,
  ): Promise<PhotoScreening> {
    const userPrompt = buildDescribeUserPrompt(place);
    const response = await this.llmClient.generate({
      authorization,
      apiType: DescribeApiType,
      model: DescribeModel,
      system: DescribeSystemPrompt,
      user: userPrompt,
      imageUrl,
      schema: DescriptionSchema,
    });
    const record = this.toRecord(
      LlmStep.Describe,
      DescribeModel,
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

  // `flavors` are all the voices, which the system prompt defines; `voices` are those to write in.
  // `authorization` is the Authorization header of the uploader's request.
  async writeCaptions(
    description: string,
    place: string | null,
    flavors: HumorFlavor[],
    voices: HumorFlavor[],
    authorization: string,
  ): Promise<WrittenCaptions> {
    const systemPrompt = buildCaptionSystemPrompt(flavors);
    const userPrompt = buildCaptionUserPrompt(description, place, voices);
    const response = await this.llmClient.generate({
      authorization,
      apiType: CaptionApiType,
      model: CaptionModel,
      system: systemPrompt,
      user: userPrompt,
      schema: CaptionsSchema,
    });

    const output = response.output;
    // The photo has passed the screening, so an answer without text is the provider failing, not a refusal
    if (!output) {
      throw new LlmBusyException();
    }

    const captions = voices.map((flavor) => {
      const written = output.captions.filter(
        (caption) => caption.voice === flavor.slug,
      );
      const text = written[0]?.text.trim();
      if (written.length !== 1 || !text || text.length > MaxCaptionLength) {
        throw new Error(
          `LLM captions do not cover the voice "${flavor.slug}" with one caption of at most ${MaxCaptionLength} characters`,
        );
      }
      return { flavor, text };
    });
    const record = this.toRecord(
      LlmStep.Caption,
      CaptionModel,
      systemPrompt,
      userPrompt,
      response,
    );
    return { captions, record };
  }

  private toRecord(
    step: LlmStep,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    response: LlmResponse<unknown>,
  ): LlmCallRecord {
    return {
      step,
      model,
      systemPrompt,
      userPrompt,
      response: response.text,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      durationMs: response.durationMs,
    };
  }
}
