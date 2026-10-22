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
      .filter(({ kept }) => kept)
      .map(({ flavor }) => flavor?.id);
    const pickedFlavorIds = picks.map(({ caption }) => caption.flavor?.id);
    const count = (ids: (string | undefined)[], flavorId: string) =>
      ids.filter((id) => id === flavorId).length;

    const streakDates = await this.findStreakDates(user.id, votes);

    return {
      streak: countStreak(
        toCampusDate(new Date()),
        streakDates.finished,
        streakDates.missed,
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

  // Sorts the batches' dates for the streak by what they asked of the user. A date's batch asks for a vote
  // on each photo the user could still vote on that date: not the user's own, not added late to the batch,
  // and not judged by the user on an earlier date. A date that asked for votes and got them all by its end
  // is finished; one that asked and did not is missed; one that asked nothing is in neither set.
  private async findStreakDates(
    userId: number,
    votes: CaptionVote[],
  ): Promise<{ finished: Set<string>; missed: Set<string> }> {
    const voteDates = new Map<string, string>();
    for (const { image, createdAt } of votes) {
      const date = toCampusDate(createdAt);
      const known = voteDates.get(image.id);
      if (known === undefined || date < known) {
        voteDates.set(image.id, date);
      }
    }
    const batches = await this.batchRepository.find({
      relations: { items: { image: { uploader: true } } },
      order: { date: 'DESC' },
      take: StreakWindow,
    });

    const finished = new Set<string>();
    const missed = new Set<string>();
    for (const batch of batches) {
      const asked = batch.items.filter(({ image, lateAddition }) => {
        if (image.uploader?.id === userId || lateAddition) {
          return false;
        }
        const voteDate = voteDates.get(image.id);
        return voteDate === undefined || voteDate >= batch.date;
      });
      if (asked.length === 0) {
        continue;
      }
      const done = asked.every(({ image }) => {
        const voteDate = voteDates.get(image.id);
        return voteDate !== undefined && voteDate <= batch.date;
      });
      (done ? finished : missed).add(batch.date);
    }
    return { finished, missed };
  }
}
