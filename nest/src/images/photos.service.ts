import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, In, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { DailyBatchItem } from '../batches/daily-batch-item.entity';
import { toCampusDate } from '../common/utils/campus-date';
import { FlavorsService } from '../flavors/flavors.service';
import { User } from '../users/user.entity';
import { judgePick } from '../votes/verdict';
import { VotesService } from '../votes/votes.service';
import { PhotoResDto, PhotoUploaderResDto } from './dto/photo.res.dto';
import { Image } from './image.entity';

export interface WaitingImage {
  id: string;
  uploaderId: number | null;
}

// A photo is an image with LLM-written captions. This service presents photos to a viewer.
@Injectable()
export class PhotosService {
  // The relations that toPhotoDtos reads
  public readonly relations = { captions: { flavor: true }, uploader: true };

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    @InjectRepository(DailyBatchItem)
    private readonly itemRepository: Repository<DailyBatchItem>,
    private readonly votesService: VotesService,
    private readonly flavorsService: FlavorsService,
  ) {}

  // The results of a photo stay hidden from a viewer who can still vote on it, so that every vote is cast blind.
  // They show to its uploader, to a viewer who has voted, and, once its batch's date has passed, to anonymous viewers, who cannot vote.
  async toPhotoDtos(
    images: Image[],
    viewerId: number | undefined,
  ): Promise<PhotoResDto[]> {
    const imageIds = images.map(({ id }) => id);
    const tallies = await this.votesService.getTallies(imageIds);
    const picks =
      viewerId === undefined
        ? new Map<string, string | null>()
        : await this.votesService.getPicks(viewerId, imageIds);
    const batchDates = await this.findBatchDates(imageIds);
    const today = toCampusDate(new Date());

    const isOwner = (image: Image) =>
      viewerId !== undefined && image.uploader?.id === viewerId;
    const waitingIds = images.some(
      (image) => isOwner(image) && !batchDates.has(image.id),
    )
      ? (await this.findWaiting()).map(({ id }) => id)
      : [];

    return images.map((image) => {
      const batchDate = batchDates.get(image.id) ?? null;
      const hasVoted = picks.has(image.id);
      const closed = batchDate !== null && batchDate < today;
      const revealed =
        isOwner(image) || hasVoted || (closed && viewerId === undefined);
      const tally = tallies.get(image.id);
      const queueIndex = waitingIds.indexOf(image.id);
      const captionId = picks.get(image.id) ?? null;
      const matched = captionId ? judgePick(tally, captionId) : null;

      return {
        id: image.id,
        url: image.url,
        description: image.description,
        place: image.place,
        uploader: image.uploader ? this.toUploaderDto(image.uploader) : null,
        batchDate,
        ...(isOwner(image) &&
          queueIndex !== -1 && { queuePosition: queueIndex + 1 }),
        createdAt: image.createdAt,
        // Ordered by the random caption ids, so that a caption's place says nothing of its flavor
        captions: image.captions
          .filter((caption) => caption.flavor)
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((caption) => ({
            id: caption.id,
            content: caption.content,
            ...(revealed && {
              flavor: this.flavorsService.toFlavorDto(caption.flavor!),
              picks: tally?.picks.get(caption.id) ?? 0,
            }),
          })),
        revealed,
        ...(revealed && {
          voters: tally?.voters ?? 0,
          nonePicks: tally?.nonePicks ?? 0,
        }),
        viewer: {
          isOwner: isOwner(image),
          hasVoted,
          captionId,
          ...(matched !== null && { matched }),
        },
      };
    });
  }

  // The photos that no batch has served yet, in the order in which batches take them:
  // uploads of users before images without an uploader, and older before newer.
  async findWaiting(): Promise<WaitingImage[]> {
    const rows = await this.imageRepository
      .createQueryBuilder('image')
      .innerJoin('image.captions', 'caption')
      .innerJoin('caption.flavor', 'flavor')
      .leftJoin('image.uploader', 'uploader')
      .leftJoin(DailyBatchItem, 'item', 'item."imageId" = image.id')
      .where('item.id IS NULL')
      .select('image.id', 'id')
      .addSelect('uploader.id', 'uploaderId')
      .addSelect('image.createdAt', 'createdAt')
      .groupBy('image.id')
      .addGroupBy('uploader.id')
      .getRawMany<{ id: string; uploaderId: number | null; createdAt: Date }>();

    return rows.sort(
      (a, b) =>
        Number(a.uploaderId === null) - Number(b.uploaderId === null) ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  // The photos of the batches from `since` up to yesterday, by the picks of their winning caption
  async findTop(since: string | null): Promise<Image[]> {
    const today = toCampusDate(new Date());
    const items = await this.itemRepository.find({
      where: {
        batch: {
          date: since
            ? And(LessThan(today), MoreThanOrEqual(since))
            : LessThan(today),
        },
      },
      relations: { image: this.relations },
    });
    const images = items.map(({ image }) => image);

    const tallies = await this.votesService.getTallies(
      images.map(({ id }) => id),
    );
    const topPicks = (image: Image) =>
      Math.max(0, ...(tallies.get(image.id)?.picks.values() ?? []));
    const voters = (image: Image) => tallies.get(image.id)?.voters ?? 0;
    return images.sort(
      (a, b) =>
        topPicks(b) - topPicks(a) ||
        voters(b) - voters(a) ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  private async findBatchDates(
    imageIds: string[],
  ): Promise<Map<string, string>> {
    if (imageIds.length === 0) {
      return new Map();
    }
    const items = await this.itemRepository.find({
      where: { image: { id: In(imageIds) } },
      relations: { batch: true, image: true },
    });
    return new Map(items.map((item) => [item.image.id, item.batch.date]));
  }

  private toUploaderDto(uploader: User): PhotoUploaderResDto {
    const lastInitial = uploader.lastName ? `${uploader.lastName[0]}.` : '';
    return {
      name:
        [uploader.firstName, lastInitial].filter(Boolean).join(' ') ||
        uploader.username,
      avatar: uploader.avatar ?? undefined,
    };
  }
}
