import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caption } from '../captions/caption.entity';
import {
  CaptionApiType,
  CaptionModel,
  Temperature,
} from '../llm/llm.constants';
import { PipelineService } from '../llm/pipeline.service';
import { PipelineStep } from '../llm/pipeline-step.entity';
import {
  buildCaptionStepSystemPrompt,
  buildLookStepSystemPrompt,
  CaptionStepName,
  CaptionStepUserPrompt,
  LookStepName,
  LookStepUserPrompt,
  NotedCaptionStepUserPrompt,
} from './chain.prompts';
import { FlavorResDto } from './dto/flavor.res.dto';
import { FlavorSeeds } from './flavors.constants';
import { canWriteCaptions, HumorFlavor } from './humor-flavor.entity';
import { PromptStep, StepInput, StepOutput } from './prompt-step.entity';

// The pipeline's caption row from before each voice had a chain of its own: at the first start after the change its
// model and temperature move into the voices' caption steps, and the row goes
const FormerCaptionStep = 'caption';

// A voice with its chain: the steps in order, each with its model and the model's provider
export const ChainRelations = { steps: { model: { provider: true } } } as const;
export const ChainOrder = {
  position: 'ASC',
  steps: { position: 'ASC' },
} as const;

@Injectable()
export class FlavorsService implements OnModuleInit {
  constructor(
    @InjectRepository(HumorFlavor)
    private readonly flavorRepository: Repository<HumorFlavor>,
    @InjectRepository(PromptStep)
    private readonly stepRepository: Repository<PromptStep>,
    @InjectRepository(Caption)
    private readonly captionRepository: Repository<Caption>,
    @InjectRepository(PipelineStep)
    private readonly pipelineStepRepository: Repository<PipelineStep>,
    private readonly pipelineService: PipelineService,
  ) {}

  // Seeds the voices the table lacks, the color of a seeded voice from before the color column, then the chain of each
  // seeded voice without steps
  async onModuleInit() {
    for (const [position, seed] of FlavorSeeds.entries()) {
      const flavor = await this.flavorRepository.findOneBy({ slug: seed.slug });
      if (!flavor) {
        await this.flavorRepository.save({
          slug: seed.slug,
          name: seed.name,
          tagline: seed.tagline,
          color: seed.color,
          position,
          inMix: true,
        });
      } else if (flavor.color === '') {
        await this.flavorRepository.update(flavor.id, { color: seed.color });
      }
    }
    await this.seedSteps();
  }

  // A seeded voice without steps gets its chain, the caption step after a look at the photo where its seed asks for
  // one, on the model and the temperature of the pipeline's former caption row while that row exists and of the code's
  // constants otherwise
  private async seedSteps(): Promise<void> {
    const former = await this.pipelineStepRepository
      .createQueryBuilder('step')
      .leftJoinAndSelect('step.model', 'model')
      .leftJoinAndSelect('model.provider', 'provider')
      .where('step.step = :name', { name: FormerCaptionStep })
      .getOne();
    const flavors = await this.flavorRepository.find({
      relations: { steps: true },
    });
    for (const flavor of flavors) {
      const seed = FlavorSeeds.find((seed) => seed.slug === flavor.slug);
      if (flavor.steps.length > 0 || !seed) {
        continue;
      }
      const model =
        former?.model ??
        (await this.pipelineService.ensureModel(CaptionApiType, CaptionModel));
      const caption = {
        name: CaptionStepName,
        input: StepInput.Text,
        output: StepOutput.Captions,
        systemPrompt: buildCaptionStepSystemPrompt(seed.slug, seed.instruction),
        userPrompt: seed.looks
          ? NotedCaptionStepUserPrompt
          : CaptionStepUserPrompt,
      };
      const look = {
        name: LookStepName,
        input: StepInput.Image,
        output: StepOutput.Text,
        systemPrompt: buildLookStepSystemPrompt(seed.slug, seed.instruction),
        userPrompt: LookStepUserPrompt,
      };
      for (const [position, step] of (seed.looks
        ? [look, caption]
        : [caption]
      ).entries()) {
        await this.stepRepository.save({
          flavor: { id: flavor.id },
          position,
          model,
          temperature: former?.temperature ?? Temperature,
          ...step,
        });
      }
    }
    if (former) {
      await this.pipelineStepRepository
        .createQueryBuilder()
        .delete()
        .where('step = :name', { name: FormerCaptionStep })
        .execute();
    }
  }

  public toFlavorDto(flavor: HumorFlavor): FlavorResDto {
    return {
      slug: flavor.slug,
      name: flavor.name,
      tagline: flavor.tagline,
      color: flavor.color,
    };
  }

  // Every voice with its chain, in display order
  async findAll(): Promise<HumorFlavor[]> {
    return await this.flavorRepository.find({
      relations: ChainRelations,
      order: ChainOrder,
    });
  }

  // The voices in the mix with their chains
  async findInMix(): Promise<HumorFlavor[]> {
    return await this.flavorRepository.find({
      where: { inMix: true },
      relations: ChainRelations,
      order: ChainOrder,
    });
  }

  // The voices new photos get captions in: those in the mix whose chains write captions
  async findWriters(): Promise<HumorFlavor[]> {
    const flavors = await this.findInMix();
    return flavors.filter((flavor) => canWriteCaptions(flavor.steps));
  }

  // The voices for a new photo: those with the fewest captions so far, so that every voice is seen equally often.
  public pickLeastUsed(
    flavors: HumorFlavor[],
    captionCounts: Map<string, number>,
    count: number,
  ): HumorFlavor[] {
    return flavors
      .map((flavor) => ({
        flavor,
        captions: captionCounts.get(flavor.id) ?? 0,
        tieBreak: Math.random(),
      }))
      .sort((a, b) => a.captions - b.captions || a.tieBreak - b.tieBreak)
      .slice(0, count)
      .map((entry) => entry.flavor);
  }

  // Kept captions per voice, by the voice's id
  async countKeptCaptions(): Promise<Map<string, number>> {
    const rows = await this.captionRepository
      .createQueryBuilder('caption')
      .innerJoin('caption.flavor', 'flavor')
      .where('caption.kept')
      .select('flavor.id', 'id')
      .addSelect('COUNT(caption.id)', 'count')
      .groupBy('flavor.id')
      .getRawMany<{ id: string; count: string }>();
    return new Map(rows.map((row) => [row.id, Number(row.count)]));
  }
}
