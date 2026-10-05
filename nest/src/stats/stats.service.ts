import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DailyBatch } from '../batches/daily-batch.entity';
import { toCampusDate } from '../common/utils/campus-date';
import { FlavorsService } from '../flavors/flavors.service';
import { Image } from '../images/image.entity';
import { RoastQuotaService } from '../llm/roast-quota.service';
import { UserResDto } from '../users/dto/user.res.dto';
import { CaptionVote, VoteValue } from '../votes/caption-vote.entity';
import { judgePick } from '../votes/verdict';
import { VotesService } from '../votes/votes.service';
import { StatsResDto } from './dto/stats.res.dto';
import { countStreak } from './streak';

// Batches read for the streak, which therefore cannot count further back
const StreakWindow = 366;

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(DailyBatch)
    private readonly batchRepository: Repository<DailyBatch>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private readonly votesService: VotesService,
    private readonly flavorsService: FlavorsService,
    private readonly roastQuotaService: RoastQuotaService,
  ) {}

  async findByUser(user: UserResDto): Promise<StatsResDto> {
    const votes = await this.votesService.findByUser(user.id);
    const votedImageIds = [...new Set(votes.map(({ image }) => image.id))];
    const picks = votes.filter(({ value }) => value === VoteValue.Up);

    const tallies = await this.votesService.getTallies(
      picks.map(({ image }) => image.id),
    );
    const verdicts = picks
      .map(({ image, caption }) => judgePick(tallies.get(image.id), caption.id))
      .filter((verdict) => verdict !== null);

    const votedImages =
      votedImageIds.length === 0
        ? []
        : await this.imageRepository.find({
            where: { id: In(votedImageIds) },
            relations: { captions: { flavor: true } },
          });
    const seenFlavorIds = votedImages
      .flatMap(({ captions }) => captions)
      .map(({ flavor }) => flavor?.id);
    const pickedFlavorIds = picks.map(({ caption }) => caption.flavor?.id);
    const count = (ids: (string | undefined)[], flavorId: string) =>
      ids.filter((id) => id === flavorId).length;

    return {
      streak: countStreak(
        toCampusDate(new Date()),
        await this.findFinishedDates(user.id, votes),
      ),
      votes: votedImageIds.length,
      judged: verdicts.length,
      matches: verdicts.filter((verdict) => verdict).length,
      flavors: (await this.flavorsService.findAll()).map((flavor) => ({
        flavor: this.flavorsService.toFlavorDto(flavor),
        picks: count(pickedFlavorIds, flavor.id),
        seen: count(seenFlavorIds, flavor.id),
      })),
      photos: await this.imageRepository.count({
        where: { uploader: { id: user.id } },
      }),
      picksReceived: await this.votesService.countPicksReceived(user.id),
      roastsLeft: await this.roastQuotaService.getRoastsLeft(user),
    };
  }

  // The dates of the batches that the user finished on their own date:
  // every photo of the batch that the user may vote on has the user's vote of that date.
  private async findFinishedDates(
    userId: number,
    votes: CaptionVote[],
  ): Promise<Set<string>> {
    const voteDates = new Map(
      votes.map(({ image, createdAt }) => [image.id, toCampusDate(createdAt)]),
    );
    const batches = await this.batchRepository.find({
      relations: { items: { image: { uploader: true } } },
      order: { date: 'DESC' },
      take: StreakWindow,
    });

    const finishedDates = new Set<string>();
    for (const batch of batches) {
      const votable = batch.items.filter(
        ({ image }) => image.uploader?.id !== userId,
      );
      if (
        votable.length > 0 &&
        votable.every(({ image }) => voteDates.get(image.id) === batch.date)
      ) {
        finishedDates.add(batch.date);
      }
    }
    return finishedDates;
  }
}
