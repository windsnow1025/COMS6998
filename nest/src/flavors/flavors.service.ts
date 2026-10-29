import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caption } from '../captions/caption.entity';
import { PromptMaterial } from '../llm/roast.prompts';
import { CaptionExample } from './caption-example.entity';
import { FlavorResDto } from './dto/flavor.res.dto';
import { FlavorSeeds } from './flavors.constants';
import { HumorFlavor } from './humor-flavor.entity';
import { Term } from './term.entity';

@Injectable()
export class FlavorsService implements OnModuleInit {
  constructor(
    @InjectRepository(HumorFlavor)
    private readonly flavorRepository: Repository<HumorFlavor>,
    @InjectRepository(Caption)
    private readonly captionRepository: Repository<Caption>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(CaptionExample)
    private readonly exampleRepository: Repository<CaptionExample>,
  ) {}

  async onModuleInit() {
    for (const [position, seed] of FlavorSeeds.entries()) {
      const exists = await this.flavorRepository.existsBy({ slug: seed.slug });
      if (!exists) {
        await this.flavorRepository.save({ ...seed, position });
      }
    }
  }

  public toFlavorDto(flavor: HumorFlavor): FlavorResDto {
    return {
      slug: flavor.slug,
      name: flavor.name,
      tagline: flavor.tagline,
    };
  }

  async findAll(): Promise<HumorFlavor[]> {
    return await this.flavorRepository.find({ order: { position: 'ASC' } });
  }

  // The voices new photos get captions in
  async findInMix(): Promise<HumorFlavor[]> {
    return await this.flavorRepository.find({
      where: { inMix: true },
      order: { position: 'ASC' },
    });
  }

  async findTerms(): Promise<Term[]> {
    return await this.termRepository.find({ order: { term: 'ASC' } });
  }

  async findExamples(): Promise<CaptionExample[]> {
    return await this.exampleRepository.find({
      relations: { flavor: true },
      order: { createdAt: 'ASC' },
    });
  }

  // What the caption step's system prompt carries beside the voices
  async findPromptMaterial(): Promise<PromptMaterial> {
    const [terms, examples] = await Promise.all([
      this.findTerms(),
      this.findExamples(),
    ]);
    return { terms, examples };
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

  async countCaptions(): Promise<Map<string, number>> {
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
