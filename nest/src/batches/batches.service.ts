import { createHash } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  LessThan,
  LessThanOrEqual,
  Repository,
} from 'typeorm';
import { addDays, toCampusDate } from '../common/utils/campus-date';
import { isUniqueViolation } from '../common/utils/query-error';
import { PhotoResDto } from '../images/dto/photo.res.dto';
import { Image } from '../images/image.entity';
import { PhotosService, WaitingImage } from '../images/photos.service';
import { VotesService } from '../votes/votes.service';
import { DailyBatchItem } from './daily-batch-item.entity';
import { DailyBatch } from './daily-batch.entity';

export const MinBatchSize = 5;
export const MaxBatchSize = 10;
// Photos carried over from earlier batches, at most, which leaves the minimum its room for new photos
export const MaxCarriedImages = MaxBatchSize - MinBatchSize;

// The images without an uploader in the order a batch of the date draws them:
// the same date draws the same images from the same pool, and another date draws others
function drawByDate(images: WaitingImage[], date: string): WaitingImage[] {
  const drawKey = (id: string) =>
    createHash('sha256').update(`${date}:${id}`).digest('hex');
  return images
    .map((image) => ({ image, key: drawKey(image.id) }))
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ image }) => image);
}

// A batch leads with the photos carried over from earlier batches, those without a verdict yet, the most voted first;
// then it takes every waiting upload of a user in their order in line, as far as the room left goes,
// and fills up to the minimum with images that have no uploader, drawn by the batch's date.
export function chooseBatchImages(
  carried: { id: string }[],
  waiting: WaitingImage[],
  date: string,
): { id: string }[] {
  const lead = carried.slice(0, MaxCarriedImages);
  const uploads = waiting.filter(({ uploaderId }) => uploaderId !== null);
  const size = Math.min(
    MaxBatchSize - lead.length,
    Math.max(MinBatchSize, uploads.length),
  );
  const drawn = drawByDate(
    waiting.filter(({ uploaderId }) => uploaderId === null),
    date,
  );
  return [...lead, ...[...uploads, ...drawn].slice(0, size)];
}

// The waiting photos that the batch of the date adds while it runs, once its new photos fall short of
// the minimum: the uploads of users in their order in line, then the draw of the date, as far as `room` goes.
export function chooseTopUpImages(
  waiting: WaitingImage[],
  date: string,
  room: number,
): { id: string }[] {
  const uploads = waiting.filter(({ uploaderId }) => uploaderId !== null);
  const drawn = drawByDate(
    waiting.filter(({ uploaderId }) => uploaderId === null),
    date,
  );
  return [...uploads, ...drawn].slice(0, room);
}

// A batch's photos in the order shown to a viewer: those whose results the viewer has yet to see first,
// as the batch orders them, so that a vote goes to the most voted photo the viewer has not voted on
export function orderFeed(photos: PhotoResDto[]): PhotoResDto[] {
  return [
    ...photos.filter(({ revealed }) => !revealed),
    ...photos.filter(({ revealed }) => revealed),
  ];
}

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(DailyBatch)
    private readonly batchRepository: Repository<DailyBatch>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly photosService: PhotosService,
    private readonly votesService: VotesService,
  ) {}

  // The batch's photos in their order
  public toImages(batch: DailyBatch): Image[] {
    return [...batch.items]
      .sort((a, b) => a.position - b.position)
      .map(({ image }) => image);
  }

  // Today's batch, which the first request of a campus date opens with the photos carried over and the waiting photos.
  // While there is neither, the batch is empty, so that the first photo to arrive opens it;
  // the same holds for a batch whose photos have all been deleted. A stored batch short of new photos tops up.
  async findToday(): Promise<DailyBatch> {
    const date = toCampusDate(new Date());
    const batch = await this.findOneByDate(date);
    if (batch && batch.items.length > 0) {
      return await this.topUp(date, batch);
    }
    return (
      (await this.open(date, batch)) ??
      this.batchRepository.create({ date, items: [] })
    );
  }

  async findPast(date: string): Promise<DailyBatch> {
    const batch =
      date <= toCampusDate(new Date()) ? await this.findOneByDate(date) : null;
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    return batch;
  }

  async findRecent(limit: number): Promise<DailyBatch[]> {
    return await this.batchRepository.find({
      where: { date: LessThanOrEqual(toCampusDate(new Date())) },
      relations: { items: { image: true } },
      order: { date: 'DESC' },
      take: limit,
    });
  }

  // The batches the user took part in, the latest first: the user voted on a photo of the batch
  // on the batch's date, or uploaded a photo that the batch served
  async findMine(userId: number): Promise<DailyBatch[]> {
    const votes = await this.votesService.findByUser(userId);
    const voteDays = new Set(
      votes.map(
        ({ image, createdAt }) => `${toCampusDate(createdAt)}:${image.id}`,
      ),
    );
    const batches = await this.batchRepository.find({
      relations: { items: { image: { uploader: true } } },
      order: { date: 'DESC' },
    });
    return batches.filter((batch) =>
      batch.items.some(
        ({ image }) =>
          image.uploader?.id === userId ||
          voteDays.has(`${batch.date}:${image.id}`),
      ),
    );
  }

  // The dates of the stored batches around the given one, up to today's; null where none exists
  async findNeighborDates(
    date: string,
  ): Promise<{ previous: string | null; next: string | null }> {
    const today = toCampusDate(new Date());
    const previous = await this.batchRepository.findOne({
      where: { date: LessThan(date) },
      order: { date: 'DESC' },
    });
    const next =
      date < today
        ? await this.batchRepository.findOne({
            where: { date: Between(addDays(date, 1), today) },
            order: { date: 'ASC' },
          })
        : null;
    return { previous: previous?.date ?? null, next: next?.date ?? null };
  }

  private async findOneByDate(date: string): Promise<DailyBatch | null> {
    return await this.batchRepository.findOne({
      where: { date },
      relations: { items: { image: this.photosService.relations } },
    });
  }

  // Gives the date's batch its photos; null while there is no photo to give.
  // `stored` is the date's batch when it is stored and has no photo left.
  private async open(
    date: string,
    stored: DailyBatch | null,
  ): Promise<DailyBatch | null> {
    const images = chooseBatchImages(
      await this.photosService.findCarryOver(date),
      await this.photosService.findWaiting(),
      date,
    );
    if (images.length === 0) {
      return null;
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const batch = stored ?? (await manager.save(DailyBatch, { date }));
        await manager.save(
          DailyBatchItem,
          images.map(({ id }, position) => ({
            batch: { id: batch.id },
            image: { id },
            position,
          })),
        );
      });
    } catch (error) {
      // A concurrent request opened the batch first, and its batch stands
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
    return await this.findOneByDate(date);
  }

  // Adds waiting photos to the date's stored batch while its new photos, those it serves first,
  // fall short of the minimum, up to the minimum of new photos within the batch's maximum size.
  // A photo added this way is marked late, and the streak's requirement leaves it out.
  private async topUp(date: string, batch: DailyBatch): Promise<DailyBatch> {
    const images = this.toImages(batch);
    const firstDates = await this.photosService.findBatchDates(
      images.map(({ id }) => id),
    );
    const newCount = images.filter(
      ({ id }) => firstDates.get(id)?.first === date,
    ).length;
    const room = Math.min(
      MinBatchSize - newCount,
      MaxBatchSize - images.length,
    );
    if (room <= 0) {
      return batch;
    }
    const added = chooseTopUpImages(
      await this.photosService.findWaiting(),
      date,
      room,
    );
    if (added.length === 0) {
      return batch;
    }

    const nextPosition =
      Math.max(...batch.items.map(({ position }) => position)) + 1;
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.save(
          DailyBatchItem,
          added.map(({ id }, index) => ({
            batch: { id: batch.id },
            image: { id },
            position: nextPosition + index,
            lateAddition: true,
          })),
        );
      });
    } catch (error) {
      // A concurrent request topped the batch up first, and its photos stand
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
    return (await this.findOneByDate(date))!;
  }
}
