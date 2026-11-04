import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as z from 'zod/v4';
import { LlmBusyException, LlmClient, LlmResponse } from '../llm/llm.client';
import { LlmCall } from '../llm/llm-call.entity';
import { RoastQuotaService } from '../llm/roast-quota.service';
import { UserResDto } from '../users/dto/user.res.dto';
import { CaptionExample } from './caption-example.entity';
import { repeatsAny } from './caption-repeats';
import {
  fillTemplate,
  formatExamples,
  formatTaken,
  formatTerms,
  formatUploaderNote,
  Placeholder,
  PlaceholderValues,
} from './chain.prompts';
import { ChainRun } from './chain-run.entity';
import { HumorFlavor } from './humor-flavor.entity';
import { PromptStep, StepInput, StepOutput } from './prompt-step.entity';
import { Term } from './term.entity';

// Times a voice writes again, at most, while its caption tells the joke of another voice's
export const MaxRewrites = 2;

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

// Runs a voice's chain on a photo: each step's prompts are filled from the photo and the previous step's answer, its
// request is made on its model, and the request is recorded as it completes
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
  // FastAPI verifies; `taken` are the captions other voices wrote for the photo, which the chain's last step is
  // told to keep away from.
  async run(
    flavor: HumorFlavor,
    photo: ChainPhoto,
    user: UserResDto,
    authorization: string,
    run: ChainRun | null,
    taken: string[] = [],
  ): Promise<ChainOutcome> {
    if (flavor.steps.length === 0) {
      throw new Error(`The chain of the voice "${flavor.slug}" has no step`);
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
    let previous = '';
    let captions: string[] | null = null;
    for (const [index, step] of flavor.steps.entries()) {
      const values: PlaceholderValues = {
        ...fixed,
        [Placeholder.Previous]: previous,
      };
      const isLast = index === flavor.steps.length - 1;
      const prompts: FilledPrompts = {
        systemPrompt: fillTemplate(step.systemPrompt, values),
        userPrompt:
          fillTemplate(step.userPrompt, values) +
          (isLast ? formatTaken(taken) : ''),
      };
      const request = {
        authorization,
        apiType: step.model.provider.apiType,
        model: step.model.name,
        temperature: step.temperature,
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

  // Runs the chain so that its caption tells none of the jokes in `taken`, the captions other voices have for the
  // photo: while its first caption repeats one of them, the chain writes again, told what is taken, and the requests
  // of the run that gave way are removed, so that every request left wrote something that stands. `first` is the
  // outcome of a run already made. A caption stands when it still repeats after the last rewrite or when the voice
  // cannot write another.
  async runApart(
    flavor: HumorFlavor,
    photo: ChainPhoto,
    user: UserResDto,
    authorization: string,
    run: ChainRun | null,
    taken: string[],
    first?: ChainOutcome,
  ): Promise<ChainOutcome> {
    let outcome =
      first ?? (await this.run(flavor, photo, user, authorization, run));
    for (let rewrite = 0; rewrite < MaxRewrites; rewrite++) {
      const caption = outcome.captions?.[0];
      if (!caption || !repeatsAny(caption, taken)) {
        break;
      }
      try {
        const next = await this.run(
          flavor,
          photo,
          user,
          authorization,
          run,
          taken,
        );
        await this.llmCallRepository.remove(outcome.calls);
        outcome = next;
      } catch {
        break;
      }
    }
    return outcome;
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
      temperature: step.temperature,
      systemPrompt: prompts.systemPrompt,
      userPrompt: prompts.userPrompt,
      response: response.text,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      durationMs: response.durationMs,
    });
  }
}
