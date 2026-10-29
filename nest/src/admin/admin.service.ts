import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { DailyBatch } from '../batches/daily-batch.entity';
import { DailyBatchItem } from '../batches/daily-batch-item.entity';
import { Caption } from '../captions/caption.entity';
import {
  addDays,
  CampusTimeZone,
  startOfCampusDate,
  toCampusDate,
} from '../common/utils/campus-date';
import { HumorFlavor } from '../flavors/humor-flavor.entity';
import { Image } from '../images/image.entity';
import { PhotosService } from '../images/photos.service';
import { LlmCall } from '../llm/llm-call.entity';
import { User } from '../users/user.entity';
import { CaptionVote, VoteValue } from '../votes/caption-vote.entity';
import { VotesService } from '../votes/votes.service';
import {
  AdminCaptionResDto,
  AdminDayResDto,
  AdminLlmCallResDto,
  AdminOverviewResDto,
  AdminPhotoDetailResDto,
  AdminPhotoPageResDto,
  AdminPhotoResDto,
  AdminUserResDto,
  AdminVotePageResDto,
  AdminVoteResDto,
} from './dto/admin.res.dto';

export const OverviewDays = 14;

// The `count` campus dates ending at `today`, oldest first, zeros where a date has no row
export function buildDays(
  today: string,
  count: number,
  rows: Map<string, Partial<AdminDayResDto>>,
): AdminDayResDto[] {
  const days: AdminDayResDto[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const row = rows.get(date);
    days.push({
      date,
      voters: row?.voters ?? 0,
      picks: row?.picks ?? 0,
      uploads: row?.uploads ?? 0,
      captions: row?.captions ?? 0,
    });
  }
  return days;
}

// Escapes the wildcards of a term for ILIKE
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (wildcard) => `\\${wildcard}`);
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    @InjectRepository(Caption)
    private readonly captionRepository: Repository<Caption>,
    @InjectRepository(CaptionVote)
    private readonly voteRepository: Repository<CaptionVote>,
    @InjectRepository(LlmCall)
    private readonly llmCallRepository: Repository<LlmCall>,
    @InjectRepository(HumorFlavor)
    private readonly flavorRepository: Repository<HumorFlavor>,
    @InjectRepository(DailyBatch)
    private readonly batchRepository: Repository<DailyBatch>,
    @InjectRepository(DailyBatchItem)
    private readonly itemRepository: Repository<DailyBatchItem>,
    private readonly photosService: PhotosService,
    private readonly votesService: VotesService,
  ) {}

  async findOverview(): Promise<AdminOverviewResDto> {
    const today = toCampusDate(new Date());
    const since = startOfCampusDate(addDays(today, -(OverviewDays - 1)));

    const [
      users,
      photos,
      photosWithoutCaptions,
      captions,
      picks,
      downs,
      batches,
      llmCalls,
    ] = await Promise.all([
      this.userRepository.count(),
      this.imageRepository.count(),
      this.imageRepository
        .createQueryBuilder('image')
        .leftJoin('image.captions', 'caption')
        .where('caption.id IS NULL')
        .getCount(),
      this.captionRepository.count({ where: { kept: true } }),
      this.voteRepository.count({ where: { value: VoteValue.Up } }),
      this.voteRepository.count({ where: { value: VoteValue.Down } }),
      this.batchRepository.count(),
      this.llmCallRepository.count(),
    ]);

    const voteRows = await this.voteRepository
      .createQueryBuilder('vote')
      .select(
        `to_char(vote."createdAt" AT TIME ZONE :tz, 'YYYY-MM-DD')`,
        'date',
      )
      .addSelect('COUNT(*) FILTER (WHERE vote.value = :up)', 'picks')
      .addSelect('COUNT(DISTINCT vote."userId")', 'voters')
      .where('vote."createdAt" >= :since')
      .setParameters({ tz: CampusTimeZone, up: VoteValue.Up, since })
      .groupBy('date')
      .getRawMany<{ date: string; picks: string; voters: string }>();

    const uploadRows = await this.imageRepository
      .createQueryBuilder('image')
      .select(
        `to_char((image."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE :tz, 'YYYY-MM-DD')`,
        'date',
      )
      .addSelect('COUNT(*)', 'uploads')
      .where(`(image."createdAt" AT TIME ZONE 'UTC') >= :since`)
      .setParameters({ tz: CampusTimeZone, since })
      .groupBy('date')
      .getRawMany<{ date: string; uploads: string }>();

    const captionRows = await this.captionRepository
      .createQueryBuilder('caption')
      .select(
        `to_char((caption."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE :tz, 'YYYY-MM-DD')`,
        'date',
      )
      .addSelect('COUNT(*)', 'captions')
      .where(`(caption."createdAt" AT TIME ZONE 'UTC') >= :since`)
      .andWhere('caption.kept = true')
      .setParameters({ tz: CampusTimeZone, since })
      .groupBy('date')
      .getRawMany<{ date: string; captions: string }>();

    const dayRows = new Map<string, Partial<AdminDayResDto>>();
    const dayRow = (date: string) => {
      const row = dayRows.get(date) ?? {};
      dayRows.set(date, row);
      return row;
    };
    for (const row of voteRows) {
      Object.assign(dayRow(row.date), {
        picks: Number(row.picks),
        voters: Number(row.voters),
      });
    }
    for (const row of uploadRows) {
      dayRow(row.date).uploads = Number(row.uploads);
    }
    for (const row of captionRows) {
      dayRow(row.date).captions = Number(row.captions);
    }

    const voiceRows = await this.flavorRepository
      .createQueryBuilder('flavor')
      .leftJoin(
        Caption,
        'caption',
        'caption."flavorId" = flavor.id AND caption.kept = true',
      )
      .leftJoin(CaptionVote, 'vote', 'vote."captionId" = caption.id')
      .select('flavor.slug', 'slug')
      .addSelect('flavor.name', 'name')
      .addSelect('COUNT(DISTINCT caption.id)', 'captions')
      .addSelect('COUNT(vote.id) FILTER (WHERE vote.value = :up)', 'picks')
      .addSelect('COUNT(vote.id) FILTER (WHERE vote.value = :down)', 'downs')
      .setParameters({ up: VoteValue.Up, down: VoteValue.Down })
      .groupBy('flavor.id')
      .orderBy('flavor.position', 'ASC')
      .getRawMany<{
        slug: string;
        name: string;
        captions: string;
        picks: string;
        downs: string;
      }>();

    const stepRows = await this.llmCallRepository
      .createQueryBuilder('call')
      .select('call.step', 'step')
      .addSelect('COUNT(*)', 'calls')
      .addSelect('COALESCE(SUM(call."inputTokens"), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(call."outputTokens"), 0)', 'outputTokens')
      .addSelect('COALESCE(AVG(call."durationMs"), 0)', 'averageDurationMs')
      .groupBy('call.step')
      .orderBy('call.step', 'ASC')
      .getRawMany<{
        step: string;
        calls: string;
        inputTokens: string;
        outputTokens: string;
        averageDurationMs: string;
      }>();

    return {
      totals: {
        users,
        photos,
        photosWithoutCaptions,
        captions,
        picks,
        downs,
        batches,
        llmCalls,
      },
      days: buildDays(today, OverviewDays, dayRows),
      voices: voiceRows.map((row) => ({
        slug: row.slug,
        name: row.name,
        captions: Number(row.captions),
        picks: Number(row.picks),
        downs: Number(row.downs),
      })),
      llmSteps: stepRows.map((row) => ({
        step: row.step,
        calls: Number(row.calls),
        inputTokens: Number(row.inputTokens),
        outputTokens: Number(row.outputTokens),
        averageDurationMs: Math.round(Number(row.averageDurationMs)),
      })),
    };
  }

  async findUsers(): Promise<AdminUserResDto[]> {
    const users = await this.userRepository.find({ order: { id: 'ASC' } });

    const photoRows = await this.imageRepository
      .createQueryBuilder('image')
      .select('image."uploaderId"', 'userId')
      .addSelect('COUNT(*)', 'photos')
      .addSelect(`MAX(image."createdAt" AT TIME ZONE 'UTC')`, 'last')
      .where('image."uploaderId" IS NOT NULL')
      .groupBy('image."uploaderId"')
      .getRawMany<{ userId: number; photos: string; last: Date }>();
    const photosByUser = new Map(photoRows.map((row) => [row.userId, row]));

    const voteRows = await this.voteRepository
      .createQueryBuilder('vote')
      .select('vote."userId"', 'userId')
      .addSelect('COUNT(DISTINCT vote."imageId")', 'photosJudged')
      .addSelect('MAX(vote."createdAt")', 'last')
      .groupBy('vote."userId"')
      .getRawMany<{ userId: number; photosJudged: string; last: Date }>();
    const votesByUser = new Map(voteRows.map((row) => [row.userId, row]));

    return users.map((user) => {
      const photoRow = photosByUser.get(user.id);
      const voteRow = votesByUser.get(user.id);
      const actions = [photoRow?.last, voteRow?.last].filter(
        (instant): instant is Date => instant !== undefined,
      );
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        createdAt: user.createdAt,
        photos: Number(photoRow?.photos ?? 0),
        photosJudged: Number(voteRow?.photosJudged ?? 0),
        lastActiveAt: actions.length
          ? new Date(Math.max(...actions.map((instant) => instant.getTime())))
          : null,
      };
    });
  }

  async findPhotos(
    offset: number,
    limit: number,
    q: string | undefined,
  ): Promise<AdminPhotoPageResDto> {
    const query = this.imageRepository
      .createQueryBuilder('image')
      .leftJoinAndSelect('image.uploader', 'uploader')
      .orderBy('image.createdAt', 'DESC')
      .skip(offset)
      .take(limit);
    if (q) {
      query
        .where(
          new Brackets((where) => {
            where
              .where('image.description ILIKE :term')
              .orWhere('image.place ILIKE :term')
              .orWhere(
                `EXISTS (SELECT 1 FROM caption WHERE caption."imageId" = image.id AND caption.content ILIKE :term)`,
              );
          }),
        )
        .setParameter('term', `%${escapeLike(q)}%`);
    }
    const [images, total] = await query.getManyAndCount();

    const imageIds = images.map((image) => image.id);
    const [tallies, batchDates, captionCounts] = await Promise.all([
      this.votesService.getTallies(imageIds),
      this.photosService.findBatchDates(imageIds),
      this.countCaptions(imageIds),
    ]);

    return {
      total,
      photos: images.map((image): AdminPhotoResDto => {
        const tally = tallies.get(image.id);
        const picks = tally
          ? [...tally.picks.values()].reduce((sum, count) => sum + count, 0)
          : 0;
        return {
          id: image.id,
          url: image.url,
          description: image.description,
          place: image.place,
          uploader: image.uploader
            ? { id: image.uploader.id, username: image.uploader.username }
            : null,
          createdAt: image.createdAt,
          latestBatchDate: batchDates.get(image.id)?.latest ?? null,
          captions: captionCounts.get(image.id) ?? 0,
          voters: tally?.voters ?? 0,
          picks,
        };
      }),
    };
  }

  async findPhoto(id: string): Promise<AdminPhotoDetailResDto> {
    const image = await this.imageRepository.findOne({
      where: { id },
      relations: { uploader: true, captions: { flavor: true, llmCall: true } },
    });
    if (!image) {
      throw new NotFoundException('Photo not found');
    }

    const votes = await this.voteRepository.find({
      where: { image: { id } },
      relations: { user: true, caption: true },
      order: { createdAt: 'DESC' },
    });
    const items = await this.itemRepository.find({
      where: { image: { id } },
      relations: { batch: true },
    });

    // The kept captions first, each group oldest first
    const captions = [...image.captions].sort((a, b) => {
      if (a.kept !== b.kept) {
        return a.kept ? -1 : 1;
      }
      return a.createdAt < b.createdAt ? -1 : 1;
    });
    return {
      id: image.id,
      url: image.url,
      description: image.description,
      place: image.place,
      uploader: image.uploader
        ? { id: image.uploader.id, username: image.uploader.username }
        : null,
      createdAt: image.createdAt,
      batchDates: items.map((item) => item.batch.date).sort(),
      captions: captions.map((caption): AdminCaptionResDto => ({
        id: caption.id,
        content: caption.content,
        kept: caption.kept,
        flavor: caption.flavor
          ? {
              slug: caption.flavor.slug,
              name: caption.flavor.name,
              tagline: caption.flavor.tagline,
            }
          : null,
        picks: votes.filter(
          (vote) =>
            vote.caption.id === caption.id && vote.value === VoteValue.Up,
        ).length,
        downs: votes.filter(
          (vote) =>
            vote.caption.id === caption.id && vote.value === VoteValue.Down,
        ).length,
        llmCallId: caption.llmCall?.id ?? null,
        createdAt: caption.createdAt,
      })),
      votes: votes.map((vote) => ({
        id: vote.id,
        user: { id: vote.user.id, username: vote.user.username },
        captionId: vote.caption.id,
        value: vote.value,
        createdAt: vote.createdAt,
      })),
    };
  }

  async findVotes(offset: number, limit: number): Promise<AdminVotePageResDto> {
    const [votes, total] = await this.voteRepository.findAndCount({
      relations: { user: true, caption: true, image: true },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
    return {
      total,
      votes: votes.map((vote): AdminVoteResDto => ({
        id: vote.id,
        user: { id: vote.user.id, username: vote.user.username },
        imageId: vote.image.id,
        imageUrl: vote.image.url,
        captionId: vote.caption.id,
        captionContent: vote.caption.content,
        value: vote.value,
        createdAt: vote.createdAt,
      })),
    };
  }

  async findLlmCall(id: string): Promise<AdminLlmCallResDto> {
    const call = await this.llmCallRepository.findOne({
      where: { id },
      relations: { image: true, user: true },
    });
    if (!call) {
      throw new NotFoundException('LLM call not found');
    }
    return {
      id: call.id,
      imageId: call.image.id,
      userId: call.user?.id ?? null,
      step: call.step,
      model: call.model,
      systemPrompt: call.systemPrompt,
      userPrompt: call.userPrompt,
      response: call.response,
      inputTokens: call.inputTokens,
      outputTokens: call.outputTokens,
      durationMs: call.durationMs,
      createdAt: call.createdAt,
    };
  }

  async updateCaption(
    id: string,
    content: string,
  ): Promise<AdminCaptionResDto> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new BadRequestException('A caption cannot be empty');
    }
    const caption = await this.captionRepository.findOne({
      where: { id },
      relations: { flavor: true, llmCall: true },
    });
    if (!caption) {
      throw new NotFoundException('Caption not found');
    }
    caption.content = trimmed;
    const saved = await this.captionRepository.save(caption);

    const [picks, downs] = await Promise.all([
      this.voteRepository.count({
        where: { caption: { id }, value: VoteValue.Up },
      }),
      this.voteRepository.count({
        where: { caption: { id }, value: VoteValue.Down },
      }),
    ]);
    return {
      id: saved.id,
      content: saved.content,
      kept: saved.kept,
      flavor: saved.flavor
        ? {
            slug: saved.flavor.slug,
            name: saved.flavor.name,
            tagline: saved.flavor.tagline,
          }
        : null,
      picks,
      downs,
      llmCallId: saved.llmCall?.id ?? null,
      createdAt: saved.createdAt,
    };
  }

  // Deletes the caption; its votes go with it
  async removeCaption(id: string): Promise<void> {
    const result = await this.captionRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Caption not found');
    }
  }

  // Changes a photo's description or its place; the captions already written stay as they are
  async updatePhoto(
    id: string,
    description: string | undefined,
    place: string | undefined,
  ): Promise<AdminPhotoDetailResDto> {
    const image = await this.imageRepository.findOneBy({ id });
    if (!image) {
      throw new NotFoundException('Photo not found');
    }
    if (description !== undefined) {
      const trimmed = description.trim();
      if (!trimmed) {
        throw new BadRequestException('A description cannot be empty');
      }
      image.description = trimmed;
    }
    if (place !== undefined) {
      image.place = place.trim() || null;
    }
    await this.imageRepository.save(image);
    return await this.findPhoto(id);
  }

  private async countCaptions(
    imageIds: string[],
  ): Promise<Map<string, number>> {
    if (imageIds.length === 0) {
      return new Map();
    }
    const rows = await this.captionRepository
      .createQueryBuilder('caption')
      .select('caption."imageId"', 'imageId')
      .addSelect('COUNT(*)', 'captions')
      .where('caption."imageId" IN (:...imageIds)', { imageIds })
      .andWhere('caption.kept = true')
      .groupBy('caption."imageId"')
      .getRawMany<{ imageId: string; captions: string }>();
    return new Map(rows.map((row) => [row.imageId, Number(row.captions)]));
  }
}
