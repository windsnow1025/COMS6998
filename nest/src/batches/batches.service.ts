import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { toCampusDate } from '../common/utils/campus-date';
import { isUniqueViolation } from '../common/utils/query-error';
import { Image } from '../images/image.entity';
import { PhotosService, WaitingImage } from '../images/photos.service';
import { DailyBatchItem } from './daily-batch-item.entity';
import { DailyBatch } from './daily-batch.entity';

export const MinBatchSize = 5;
export const MaxBatchSize = 10;

// A batch takes every waiting upload of a user up to the maximum,
// and fills up to the minimum with images that have no uploader.
export function chooseBatchImages(waiting: WaitingImage[]): WaitingImage[] {
  const uploads = waiting.filter(({ uploaderId }) => uploaderId !== null);
  const size = Math.min(MaxBatchSize, Math.max(MinBatchSize, uploads.length));
  return waiting.slice(0, size);
}

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(DailyBatch)
    private readonly batchRepository: Repository<DailyBatch>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly photosService: PhotosService,
  ) {}

  // The batch's photos in their order
  public toImages(batch: DailyBatch): Image[] {
    return [...batch.items]
      .sort((a, b) => a.position - b.position)
      .map(({ image }) => image);
  }

  // Today's batch, which the first request of a campus date opens with the waiting photos.
  // While no photo waits, the batch is empty, so that the first photo to arrive opens it;
  // the same holds for a batch whose photos have all been deleted.
  async findToday(): Promise<DailyBatch> {
    const date = toCampusDate(new Date());
    const batch = await this.findOneByDate(date);
    if (batch && batch.items.length > 0) {
      return batch;
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

  private async findOneByDate(date: string): Promise<DailyBatch | null> {
    return await this.batchRepository.findOne({
      where: { date },
      relations: { items: { image: this.photosService.relations } },
    });
  }

  // Gives the date's batch the waiting photos; null while no photo waits.
  // `stored` is the date's batch when it is stored and has no photo left.
  private async open(
    date: string,
    stored: DailyBatch | null,
  ): Promise<DailyBatch | null> {
    const images = chooseBatchImages(await this.photosService.findWaiting());
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
}
