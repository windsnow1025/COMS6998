import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { RequestWithOptionalUser } from '../auth/interfaces/request-with-optional-user.interface';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Public } from '../common/decorators/public.decorator';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { toCampusDate } from '../common/utils/campus-date';
import { PhotosService } from '../images/photos.service';
import { BatchesService, chooseCover } from './batches.service';
import { DailyBatch } from './daily-batch.entity';
import { BatchDateReqDto } from './dto/batch.req.dto';
import { BatchResDto, BatchSummaryResDto } from './dto/batch.res.dto';

const RecentBatches = 14;

@Controller('batches')
export class BatchesController {
  constructor(
    private readonly batchesService: BatchesService,
    private readonly photosService: PhotosService,
  ) {}

  // The latest batches, each covered as the viewer took part in it
  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get()
  async findRecent(
    @Req() req: RequestWithOptionalUser,
  ): Promise<BatchSummaryResDto[]> {
    return await this.toSummaryDtos(
      await this.batchesService.findRecent(RecentBatches),
      req.user?.id,
    );
  }

  // The batches the viewer took part in, the latest first
  @Get('mine')
  async findMine(@Req() req: RequestWithUser): Promise<BatchSummaryResDto[]> {
    return await this.toSummaryDtos(
      await this.batchesService.findMine(req.user.id),
      req.user.id,
    );
  }

  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get('today')
  async findToday(@Req() req: RequestWithOptionalUser): Promise<BatchResDto> {
    const batch = await this.batchesService.findToday();
    return await this.toBatchDto(batch, req.user?.id);
  }

  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get(':date')
  async findPast(
    @Req() req: RequestWithOptionalUser,
    @Param() batchDateReqDto: BatchDateReqDto,
  ): Promise<BatchResDto> {
    const batch = await this.batchesService.findPast(batchDateReqDto.date);
    return await this.toBatchDto(batch, req.user?.id);
  }

  private async toSummaryDtos(
    batches: DailyBatch[],
    viewerId: number | undefined,
  ): Promise<BatchSummaryResDto[]> {
    const imagesByBatch = batches.map((batch) =>
      this.batchesService.toImages(batch),
    );
    const batchDates = await this.photosService.findBatchDates(
      imagesByBatch.flat().map(({ id }) => id),
    );
    const firstDates = new Map(
      [...batchDates].map(([id, { first }]) => [id, first]),
    );
    const votedDates =
      viewerId === undefined
        ? new Map<string, string>()
        : await this.batchesService.findVotedDates(viewerId);
    return batches.map((batch, index) => {
      const images = imagesByBatch[index];
      const cover = chooseCover(images, firstDates, votedDates, batch.date);
      return {
        date: batch.date,
        photoCount: images.length,
        coverUrl: cover?.url ?? null,
      };
    });
  }

  private async toBatchDto(
    batch: DailyBatch,
    viewerId: number | undefined,
  ): Promise<BatchResDto> {
    const images = this.batchesService.toImages(batch);
    const judgedBefore = await this.photosService.findJudgedBefore(
      images,
      viewerId,
      batch.date,
    );
    const neighbors = await this.batchesService.findNeighborDates(batch.date);
    const photos = await this.photosService.toPhotoDtos(images, viewerId);
    return {
      date: batch.date,
      closed: batch.date < toCampusDate(new Date()),
      previousDate: neighbors.previous,
      nextDate: neighbors.next,
      photos: photos.filter(({ id }) => !judgedBefore.has(id)),
      judgedBefore: photos.filter(({ id }) => judgedBefore.has(id)),
    };
  }
}
