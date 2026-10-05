import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caption } from '../captions/caption.entity';
import { FlavorResDto } from './dto/flavor.res.dto';
import { FlavorSeeds } from './flavors.constants';
import { HumorFlavor } from './humor-flavor.entity';

@Injectable()
export class FlavorsService implements OnModuleInit {
  constructor(
    @InjectRepository(HumorFlavor)
    private readonly flavorRepository: Repository<HumorFlavor>,
    @InjectRepository(Caption)
    private readonly captionRepository: Repository<Caption>,
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
      .select('flavor.id', 'id')
      .addSelect('COUNT(caption.id)', 'count')
      .groupBy('flavor.id')
      .getRawMany<{ id: string; count: string }>();
    return new Map(rows.map((row) => [row.id, Number(row.count)]));
  }
}
