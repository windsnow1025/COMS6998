import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as z from 'zod/v4';
import { LlmBusyException, LlmClient, LlmResponse } from '../llm/llm.client';
import { LlmCall } from '../llm/llm-call.entity';
import { RoastQuotaService } from '../llm/roast-quota.service';
import { UserResDto } from '../users/dto/user.res.dto';
import { CaptionExample } from './caption-example.entity';
import {
  fillTemplate,
  formatExamples,
  formatTerms,
  formatUploaderNote,
  Placeholder,
  PlaceholderValues,
} from './chain.prompts';
import { ChainRun } from './chain-run.entity';
import { HumorFlavor } from './humor-flavor.entity';
import { PromptStep, StepInput, StepOutput } from './prompt-step.entity';
import { Term } from './term.entity';

const TextSchema = z.object({ text: z.string() });
const CaptionsSchema = z.object({ captions: z.array(z.string()) });

// The photo a chain runs on
export interface ChainPhoto {
  id: string;
  url: string;
  description: string;
  place: string | null;
}

export interface ChainOutcome {
  // The steps' requests, in the chain's order
  calls: LlmCall[];
  // The final step's answer: its text, or its captions joined by line breaks
  text: string;
  // The final step's captions; null when it answered text
  captions: string[] | null;
}

// The prompts of a step as they were sent
interface FilledPrompts {
  systemPrompt: string;
  userPrompt: string;
}

// Runs a voice's chain on a photo. The chain starts from the photo's description, the answer of the describe step
// that every chain shares (RoastService); each of its own steps has its prompts filled from the photo and the
// previous step's answer, its request made on its model, and the request recorded as it completes
@Injectable()
export class ChainRunnerService {
  constructor(
    private readonly llmClient: LlmClient,
    private readonly roastQuotaService: RoastQuotaService,
    @InjectRepository(LlmCall)
    private readonly llmCallRepository: Repository<LlmCall>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(CaptionExample)
    private readonly exampleRepository: Repository<CaptionExample>,
  ) {}

  // `flavor.steps` are in the chain's order with their models; `run` is the chain tool's run the requests belong to,
  // null for the product's own generation; `authorization` is the Authorization header of the user's request, which
  // FastAPI verifies.
  async run(
    flavor: HumorFlavor,
    photo: ChainPhoto,
    user: UserResDto,
    authorization: string,
    run: ChainRun | null,
  ): Promise<ChainOutcome> {
    if (flavor.steps.length === 0) {
      throw new Error(
        `The chain of the voice "${flavor.slug}" has no step of its own`,
      );
    }
    const [terms, examples] = await Promise.all([
      this.termRepository.find({ order: { term: 'ASC' } }),
      this.exampleRepository.find({
        where: { flavor: { id: flavor.id } },
        order: { createdAt: 'ASC' },
      }),
    ]);
    const fixed = {
      [Placeholder.Description]: photo.description,
      [Placeholder.UploaderNote]: formatUploaderNote(photo.place),
      [Placeholder.Examples]: formatExamples(examples),
      [Placeholder.Terms]: formatTerms(terms),
    };

    const calls: LlmCall[] = [];
    let previous = photo.description;
    let captions: string[] | null = null;
    for (const step of flavor.steps) {
      const values: PlaceholderValues = {
        ...fixed,
        [Placeholder.Previous]: previous,
      };
      const prompts: FilledPrompts = {
        systemPrompt: fillTemplate(step.systemPrompt, values),
        userPrompt: fillTemplate(step.userPrompt, values),
      };
      const request = {
        authorization,
        apiType: step.model.provider.apiType,
        model: step.model.name,
        system: prompts.systemPrompt,
        user: prompts.userPrompt,
        imageUrl: step.input === StepInput.Image ? photo.url : undefined,
      };
      await this.roastQuotaService.takeLlmCall(user);

      if (step.output === StepOutput.Captions) {
        const response = await this.llmClient.generate({
          ...request,
          schema: CaptionsSchema,
        });
        calls.push(
          await this.record(step, flavor, photo, user, run, prompts, response),
        );
        captions = this.toCaptions(response.output, step, flavor);
        previous = captions.join('\n');
      } else {
        const response = await this.llmClient.generate({
          ...request,
          schema: TextSchema,
        });
        calls.push(
          await this.record(step, flavor, photo, user, run, prompts, response),
        );
        captions = null;
        previous = this.toText(response.output, step, flavor);
      }
    }
    return { calls, text: previous, captions };
  }

  // The photo has passed the screening, so a step's answer without text is the provider failing, not a refusal
  private toCaptions(
    output: z.infer<typeof CaptionsSchema> | null,
    step: PromptStep,
    flavor: HumorFlavor,
  ): string[] {
    if (!output) {
      throw new LlmBusyException();
    }
    const captions = output.captions
      .map((caption) => caption.trim())
      .filter((caption) => caption.length > 0);
    if (captions.length === 0) {
      throw new Error(
        `The step "${step.name}" of the voice "${flavor.slug}" wrote no caption`,
      );
    }
    return captions;
  }

  private toText(
    output: z.infer<typeof TextSchema> | null,
    step: PromptStep,
    flavor: HumorFlavor,
  ): string {
    if (!output) {
      throw new LlmBusyException();
    }
    const text = output.text.trim();
    if (!text) {
      throw new Error(
        `The step "${step.name}" of the voice "${flavor.slug}" answered nothing`,
      );
    }
    return text;
  }

  private async record(
    step: PromptStep,
    flavor: HumorFlavor,
    photo: ChainPhoto,
    user: UserResDto,
    run: ChainRun | null,
    prompts: FilledPrompts,
    response: LlmResponse<unknown>,
  ): Promise<LlmCall> {
    return await this.llmCallRepository.save({
      image: { id: photo.id },
      user: { id: user.id },
      flavor: { id: flavor.id },
      run: run ? { id: run.id } : null,
      step: step.name,
      model: step.model.name,
      systemPrompt: prompts.systemPrompt,
      userPrompt: prompts.userPrompt,
      response: response.text,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      durationMs: response.durationMs,
    });
  }
}
