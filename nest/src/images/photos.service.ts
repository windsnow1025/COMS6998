import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DailyBatchItem } from '../batches/daily-batch-item.entity';
import { toCampusDate } from '../common/utils/campus-date';
import { FlavorsService } from '../flavors/flavors.service';
import { User } from '../users/user.entity';
import { hasVerdict, judgePick } from '../votes/verdict';
import { VotesService } from '../votes/votes.service';
import { PhotoResDto, PhotoUploaderResDto } from './dto/photo.res.dto';
import { Image } from './image.entity';

export interface WaitingImage {
  id: string;
  uploaderId: number | null;
}

// A photo that an earlier batch served and that has no verdict yet
export interface CarriedImage {
  id: string;
  voters: number;
  // The date of the first batch that served the photo
  firstDate: string;
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
  // They show to its uploader, to a viewer who has voted, and to everyone once the date of its latest batch has passed, when voting ends.
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
      const batchDate = batchDates.get(image.id)?.latest ?? null;
      const hasVoted = picks.has(image.id);
      const closed = batchDate !== null && batchDate < today;
      const revealed = isOwner(image) || hasVoted || closed;
      const tally = tallies.get(image.id);
      const queueIndex = waitingIds.indexOf(image.id);
      const captionId = picks.get(image.id) ?? null;
      const matched = captionId ? judgePick(tally, captionId) : null;
      // Ordered by the random caption ids, so that a caption's place says nothing of its flavor
      const written = image.captions
        .filter((caption) => caption.flavor)
        .sort((a, b) => a.id.localeCompare(b.id));
      // A photo whose captions were written as drafts has drafts that it does not keep
      const showsDrafts =
        isOwner(image) &&
        batchDate === null &&
        written.some(({ kept }) => !kept);

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
        captions: written
          .filter(({ kept }) => kept)
          .map((caption) => ({
            id: caption.id,
            content: caption.content,
            ...(revealed && {
              flavor: this.flavorsService.toFlavorDto(caption.flavor!),
              picks: tally?.picks.get(caption.id) ?? 0,
            }),
          })),
        ...(showsDrafts && {
          drafts: written.map((caption) => ({
            id: caption.id,
            content: caption.content,
            flavor: this.flavorsService.toFlavorDto(caption.flavor!),
            kept: caption.kept,
          })),
        }),
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

  // The photos with kept captions that no batch has served yet: uploads of users first, older before newer,
  // which is their order in line, then the images without an uploader, which a batch draws by its date.
  async findWaiting(): Promise<WaitingImage[]> {
    const rows = await this.imageRepository
      .createQueryBuilder('image')
      .innerJoin('image.captions', 'caption', 'caption.kept')
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

  // The photos whose latest batch is from `since` up to yesterday, by the picks of their winning caption;
  // a photo that a batch of today serves again is not among them
  async findTop(since: string | null): Promise<Image[]> {
    const today = toCampusDate(new Date());
    const images = [...(await this.findServings()).values()]
      .filter(({ dates }) => {
        const latest = dates[dates.length - 1];
        return latest < today && (since === null || latest >= since);
      })
      .map(({ image }) => image);

    const tallies = await this.votesService.getTallies(
      images.map(({ id }) => id),
    );
    const topPicks = (image: Image) =>
      Math.max(0, ...(tallies.get(image.id)?.picks.values() ?? []));
    const voters = (image: Image) => tallies.get(image.id)?.voters ?? 0;
    // A photo without a verdict has no winning caption and no place on the list
    return images
      .filter((image) => hasVerdict(tallies.get(image.id)))
      .sort(
        (a, b) =>
          topPicks(b) - topPicks(a) ||
          voters(b) - voters(a) ||
          b.createdAt.getTime() - a.createdAt.getTime(),
      );
  }

  // The photos that an earlier batch served and that have no verdict yet (too few voters, or a tie among the
  // most picked captions), for the batch of `date` to carry over: the most voted first, then the earliest served,
  // so that votes gather on a few photos until they decide them.
  // A photo whose latest batch is of `date` or later is being served and is left out.
  async findCarryOver(date: string): Promise<CarriedImage[]> {
    const served = [...(await this.findServings()).values()].filter(
      ({ dates }) => dates[dates.length - 1] < date,
    );
    const tallies = await this.votesService.getTallies(
      served.map(({ image }) => image.id),
    );
    return served
      .filter(({ image }) => !hasVerdict(tallies.get(image.id)))
      .map(({ image, dates }) => ({
        id: image.id,
        voters: tallies.get(image.id)?.voters ?? 0,
        firstDate: dates[0],
      }))
      .sort(
        (a, b) =>
          b.voters - a.voters ||
          a.firstDate.localeCompare(b.firstDate) ||
          a.id.localeCompare(b.id),
      );
  }

  // Whether the date of the photo's latest batch has passed, so that voting on it has ended
  async isClosed(imageId: string): Promise<boolean> {
    const batchDate = (await this.findBatchDates([imageId])).get(
      imageId,
    )?.latest;
    return batchDate !== undefined && batchDate < toCampusDate(new Date());
  }

  // The photos among `images` that the viewer judged before the campus date `date`: those the viewer voted on
  // before it, and those the viewer uploaded that an earlier batch served. A batch of that date carries such a
  // photo over for the other viewers, and the viewer's feed of the batch leaves it out.
  async findJudgedBefore(
    images: Image[],
    viewerId: number | undefined,
    date: string,
  ): Promise<Set<string>> {
    if (viewerId === undefined) {
      return new Set();
    }
    const imageIds = images.map(({ id }) => id);
    const voteDates = await this.votesService.getVoteDates(viewerId, imageIds);
    const batchDates = await this.findBatchDates(imageIds);
    return new Set(
      images
        .filter((image) => {
          const votedAt = voteDates.get(image.id);
          if (votedAt !== undefined && toCampusDate(votedAt) < date) {
            return true;
          }
          const first = batchDates.get(image.id)?.first;
          return (
            image.uploader?.id === viewerId &&
            first !== undefined &&
            first < date
          );
        })
        .map(({ id }) => id),
    );
  }

  // The dates of the first and of the latest batch that served each of the photos
  async findBatchDates(
    imageIds: string[],
  ): Promise<Map<string, { first: string; latest: string }>> {
    if (imageIds.length === 0) {
      return new Map();
    }
    const items = await this.itemRepository.find({
      where: { image: { id: In(imageIds) } },
      relations: { batch: true, image: true },
    });
    const dates = new Map<string, { first: string; latest: string }>();
    for (const { image, batch } of items) {
      const known = dates.get(image.id);
      if (known === undefined) {
        dates.set(image.id, { first: batch.date, latest: batch.date });
      } else {
        known.first = batch.date < known.first ? batch.date : known.first;
        known.latest = batch.date > known.latest ? batch.date : known.latest;
      }
    }
    return dates;
  }

  // Every photo that a batch has served, with the dates of its batches, earliest first
  private async findServings(): Promise<
    Map<string, { image: Image; dates: string[] }>
  > {
    const items = await this.itemRepository.find({
      relations: { batch: true, image: this.relations },
    });
    const servings = new Map<string, { image: Image; dates: string[] }>();
    for (const { image, batch } of items) {
      const serving = servings.get(image.id) ?? { image, dates: [] };
      serving.dates.push(batch.date);
      servings.set(image.id, serving);
    }
    for (const { dates } of servings.values()) {
      dates.sort();
    }
    return servings;
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
