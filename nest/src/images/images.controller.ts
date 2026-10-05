import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { RequestWithOptionalUser } from '../auth/interfaces/request-with-optional-user.interface';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { addDays, toCampusDate } from '../common/utils/campus-date';
import { VoteReqDto } from '../votes/dto/vote.req.dto';
import {
  MaxPlaceLength,
  PhotoCreateReqDto,
  TopPhotosReqDto,
} from './dto/photo.req.dto';
import { PhotoResDto } from './dto/photo.res.dto';
import { Image } from './image.entity';
import { ImagesService } from './images.service';
import { PhotosService } from './photos.service';

const MaxPhotoBytes = 8 * 1024 * 1024;
const TopWeekDays = 7;

// https://docs.nestjs.com/techniques/file-upload
const PhotoBodySchema = {
  type: 'object',
  required: ['file'],
  properties: {
    file: { type: 'string', format: 'binary' },
    place: { type: 'string', maxLength: MaxPlaceLength },
  },
};
const PhotoFileInterceptor = FileInterceptor('file', {
  limits: { fileSize: MaxPhotoBytes },
});

@Controller('images')
export class ImagesController {
  constructor(
    private readonly imagesService: ImagesService,
    private readonly photosService: PhotosService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: PhotoBodySchema })
  @UseInterceptors(PhotoFileInterceptor)
  async create(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() photoCreateReqDto: PhotoCreateReqDto,
  ): Promise<PhotoResDto> {
    return await this.store(req, file, photoCreateReqDto, false);
  }

  // A seed photo has no uploader
  @Post('seed')
  @Roles([Role.Admin])
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: PhotoBodySchema })
  @UseInterceptors(PhotoFileInterceptor)
  async createSeed(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() photoCreateReqDto: PhotoCreateReqDto,
  ): Promise<PhotoResDto> {
    return await this.store(req, file, photoCreateReqDto, true);
  }

  private async store(
    req: RequestWithUser,
    file: Express.Multer.File | undefined,
    photoCreateReqDto: PhotoCreateReqDto,
    seed: boolean,
  ): Promise<PhotoResDto> {
    if (!file) {
      throw new BadRequestException('A photo file is required');
    }
    const image = await this.imagesService.create(
      req.user,
      file,
      photoCreateReqDto.place?.trim() || null,
      seed,
      req.headers.authorization!,
    );
    return await this.toPhotoDto(
      await this.imagesService.findOne(image.id),
      req.user.id,
    );
  }

  @Post(':id/captions')
  async writeCaptions(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PhotoResDto> {
    const image = await this.imagesService.writeCaptions(
      req.user,
      id,
      req.headers.authorization!,
    );
    return await this.toPhotoDto(image, req.user.id);
  }

  @Post(':id/votes')
  async vote(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() voteReqDto: VoteReqDto,
  ): Promise<PhotoResDto> {
    const image = await this.imagesService.vote(
      req.user,
      id,
      voteReqDto.captionId,
    );
    return await this.toPhotoDto(image, req.user.id);
  }

  @Get('mine')
  async findMine(@Req() req: RequestWithUser): Promise<PhotoResDto[]> {
    const images = await this.imagesService.findByUploader(req.user.id);
    return await this.photosService.toPhotoDtos(images, req.user.id);
  }

  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get('top')
  async findTop(
    @Req() req: RequestWithOptionalUser,
    @Query(new ValidationPipe({ transform: true }))
    topPhotosReqDto: TopPhotosReqDto,
  ): Promise<PhotoResDto[]> {
    const { range, limit, offset } = topPhotosReqDto;
    const since =
      range === 'week' ? addDays(toCampusDate(new Date()), -TopWeekDays) : null;
    const images = await this.photosService.findTop(since);
    return await this.photosService.toPhotoDtos(
      images.slice(offset, offset + limit),
      req.user?.id,
    );
  }

  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get(':id')
  async findOne(
    @Req() req: RequestWithOptionalUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PhotoResDto> {
    const image = await this.imagesService.findOne(id);
    return await this.toPhotoDto(image, req.user?.id);
  }

  @Delete(':id')
  async remove(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.imagesService.remove(req.user, id);
  }

  private async toPhotoDto(
    image: Image,
    viewerId: number | undefined,
  ): Promise<PhotoResDto> {
    const [photo] = await this.photosService.toPhotoDtos([image], viewerId);
    return photo;
  }
}
