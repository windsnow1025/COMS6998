import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { RequestWithOptionalUser } from '../auth/interfaces/request-with-optional-user.interface';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Public } from '../common/decorators/public.decorator';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { toCampusDate } from '../common/utils/campus-date';
import { PhotosService } from '../images/photos.service';
import { BatchesService, orderFeed } from './batches.service';
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

  @Public()
  @Get()
  async findRecent(): Promise<BatchSummaryResDto[]> {
    const batches = await this.batchesService.findRecent(RecentBatches);
    return batches.map((batch) => this.toSummaryDto(batch));
  }

  // The batches the viewer took part in, the latest first
  @Get('mine')
  async findMine(@Req() req: RequestWithUser): Promise<BatchSummaryResDto[]> {
    const batches = await this.batchesService.findMine(req.user.id);
    return batches.map((batch) => this.toSummaryDto(batch));
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

  private toSummaryDto(batch: DailyBatch): BatchSummaryResDto {
    const images = this.batchesService.toImages(batch);
    return {
      date: batch.date,
      photoCount: images.length,
      coverUrl: images[0]?.url ?? null,
    };
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
      photos: orderFeed(photos.filter(({ id }) => !judgedBefore.has(id))),
      judgedBefore: photos.filter(({ id }) => judgedBefore.has(id)),
    };
  }
}
