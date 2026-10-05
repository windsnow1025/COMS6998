import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { isUniqueViolation } from '../common/utils/query-error';
import { Image } from '../images/image.entity';
import { CaptionVote, VoteValue } from './caption-vote.entity';

export interface PhotoTally {
  // Picks per caption id
  picks: Map<string, number>;
  // Users who voted on the photo
  voters: number;
  // Voters who rejected every caption
  nonePicks: number;
}

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(CaptionVote)
    private readonly voteRepository: Repository<CaptionVote>,
  ) {}

  // Records the user's one vote on a photo: the picked caption, or null to reject every caption.
  // `image` carries its captions and its uploader.
  async vote(
    userId: number,
    image: Image,
    captionId: string | null,
  ): Promise<void> {
    if (image.uploader?.id === userId) {
      throw new ForbiddenException('You cannot vote on your own photo');
    }
    if (image.captions.length === 0) {
      throw new BadRequestException('This photo has no captions to vote on');
    }
    if (captionId && !image.captions.some(({ id }) => id === captionId)) {
      throw new BadRequestException('The caption is not one of this photo');
    }
    if (await this.hasVoted(userId, image.id)) {
      throw new ConflictException('You have already voted on this photo');
    }

    const captionIds = captionId
      ? [captionId]
      : image.captions.map(({ id }) => id);
    const votes = captionIds.map((id) => ({
      user: { id: userId },
      caption: { id },
      image: { id: image.id },
      value: captionId ? VoteValue.Up : VoteValue.Down,
    }));

    try {
      await this.voteRepository.save(votes);
    } catch (error) {
      // A concurrent vote of the same user won the race
      if (isUniqueViolation(error)) {
        throw new ConflictException('You have already voted on this photo');
      }
      throw error;
    }
  }

  async getTallies(imageIds: string[]): Promise<Map<string, PhotoTally>> {
    const tallies = new Map<string, PhotoTally>();
    if (imageIds.length === 0) {
      return tallies;
    }

    const voterRows = await this.voteRepository
      .createQueryBuilder('vote')
      .innerJoin('vote.image', 'image')
      .innerJoin('vote.user', 'user')
      .select('image.id', 'imageId')
      .addSelect('COUNT(DISTINCT user.id)', 'voters')
      .addSelect(
        'COUNT(DISTINCT user.id) FILTER (WHERE vote.value = :down)',
        'nonePicks',
      )
      .where('image.id IN (:...imageIds)', { imageIds })
      .setParameter('down', VoteValue.Down)
      .groupBy('image.id')
      .getRawMany<{ imageId: string; voters: string; nonePicks: string }>();
    for (const row of voterRows) {
      tallies.set(row.imageId, {
        picks: new Map(),
        voters: Number(row.voters),
        nonePicks: Number(row.nonePicks),
      });
    }

    const pickRows = await this.voteRepository
      .createQueryBuilder('vote')
      .innerJoin('vote.image', 'image')
      .innerJoin('vote.caption', 'caption')
      .select('image.id', 'imageId')
      .addSelect('caption.id', 'captionId')
      .addSelect('COUNT(vote.id)', 'picks')
      .where('image.id IN (:...imageIds)', { imageIds })
      .andWhere('vote.value = :up', { up: VoteValue.Up })
      .groupBy('image.id')
      .addGroupBy('caption.id')
      .getRawMany<{ imageId: string; captionId: string; picks: string }>();
    for (const row of pickRows) {
      tallies.get(row.imageId)!.picks.set(row.captionId, Number(row.picks));
    }

    return tallies;
  }

  // The user's votes by image id: the picked caption's id, or null for a photo whose captions the user rejected.
  async getPicks(
    userId: number,
    imageIds: string[],
  ): Promise<Map<string, string | null>> {
    const picks = new Map<string, string | null>();
    if (imageIds.length === 0) {
      return picks;
    }

    const votes = await this.voteRepository.find({
      where: { user: { id: userId }, image: { id: In(imageIds) } },
      relations: { image: true, caption: true },
    });
    for (const vote of votes) {
      if (vote.value === VoteValue.Up) {
        picks.set(vote.image.id, vote.caption.id);
      } else if (!picks.has(vote.image.id)) {
        picks.set(vote.image.id, null);
      }
    }
    return picks;
  }

  // Every vote of the user, with its image and its caption's flavor
  async findByUser(userId: number): Promise<CaptionVote[]> {
    return await this.voteRepository.find({
      where: { user: { id: userId } },
      relations: { image: true, caption: { flavor: true } },
    });
  }

  // Picks received by the captions of the photos that the user uploaded
  async countPicksReceived(userId: number): Promise<number> {
    return await this.voteRepository.count({
      where: { image: { uploader: { id: userId } }, value: VoteValue.Up },
    });
  }

  private async hasVoted(userId: number, imageId: string): Promise<boolean> {
    return await this.voteRepository.existsBy({
      user: { id: userId },
      image: { id: imageId },
    });
  }
}
