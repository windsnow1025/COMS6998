import { randomUUID } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Caption } from '../captions/caption.entity';
import { Role } from '../common/enums/role.enum';
import { isUniqueViolation } from '../common/utils/query-error';
import { S3Service } from '../files/s3.service';
import { FlavorsService } from '../flavors/flavors.service';
import { LlmCall } from '../llm/llm-call.entity';
import { CaptionsPerPhoto } from '../llm/llm.constants';
import { RoastQuotaService } from '../llm/roast-quota.service';
import { PhotoScreening, RoastService } from '../llm/roast.service';
import { UserResDto } from '../users/dto/user.res.dto';
import { VotesService } from '../votes/votes.service';
import { detectImageType } from './image-type';
import { Image } from './image.entity';
import { PhotosService } from './photos.service';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly s3Service: S3Service,
    private readonly roastService: RoastService,
    private readonly roastQuotaService: RoastQuotaService,
    private readonly flavorsService: FlavorsService,
    private readonly votesService: VotesService,
    private readonly photosService: PhotosService,
  ) {}

  // The image with its uploader and its LLM-written captions
  async findOne(id: string): Promise<Image> {
    const image = await this.imageRepository.findOne({
      where: { id },
      relations: this.photosService.relations,
    });
    if (!image) {
      throw new NotFoundException('Photo not found');
    }
    image.captions = image.captions.filter((caption) => caption.flavor);
    return image;
  }

  async findByUploader(userId: number): Promise<Image[]> {
    return await this.imageRepository.find({
      where: { uploader: { id: userId } },
      relations: this.photosService.relations,
      order: { createdAt: 'DESC' },
    });
  }

  // Stores the photo's file, which the LLM reads by its URL, then screens and describes the photo.
  // The file of an unsuitable photo is removed, and nothing of the photo is kept.
  // `authorization` is the Authorization header of the user's request.
  async create(
    user: UserResDto,
    file: Express.Multer.File,
    place: string | null,
    authorization: string,
  ): Promise<Image> {
    const type = detectImageType(file.buffer);
    if (!type) {
      throw new UnsupportedMediaTypeException(
        'Upload a JPEG, PNG, or WebP image',
      );
    }

    await this.roastQuotaService.takeRoast(user);
    const storageKey = `photos/${user.id}/${randomUUID()}.${type.extension}`;
    let screening: PhotoScreening;
    try {
      await this.s3Service.uploadFile(
        storageKey,
        file.buffer,
        file.size,
        type.mediaType,
      );
      screening = await this.roastService.screen(
        this.s3Service.getFileUrl(storageKey),
        place,
        authorization,
      );
    } catch (error) {
      await this.roastQuotaService.returnRoast(user);
      await this.s3Service.removeObject(storageKey);
      throw error;
    }
    if (!screening.suitable) {
      await this.s3Service.removeObject(storageKey);
      throw new UnprocessableEntityException(screening.reason);
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const image = await manager.save(Image, {
          url: this.s3Service.getFileUrl(storageKey),
          description: screening.description,
          place,
          storageKey,
          uploader: { id: user.id },
        });
        await manager.save(LlmCall, {
          ...screening.record,
          image: { id: image.id },
          user: { id: user.id },
        });
        return image;
      });
    } catch (error) {
      await this.s3Service.removeObject(storageKey);
      throw error;
    }
  }

  // Captions the photo once: a photo that has captions keeps them.
  // `authorization` is the Authorization header of the user's request.
  async writeCaptions(
    user: UserResDto,
    id: string,
    authorization: string,
  ): Promise<Image> {
    const image = await this.findOne(id);
    this.checkCanManage(user, image);
    if (image.captions.length > 0) {
      return image;
    }

    await this.roastQuotaService.takeLlmCall(user);
    const flavors = await this.flavorsService.findAll();
    const voices = this.flavorsService.pickLeastUsed(
      flavors,
      await this.flavorsService.countCaptions(),
      CaptionsPerPhoto,
    );
    const written = await this.roastService.writeCaptions(
      image.description,
      image.place,
      flavors,
      voices,
      authorization,
    );

    try {
      await this.dataSource.transaction(async (manager) => {
        const llmCall = await manager.save(LlmCall, {
          ...written.record,
          image: { id },
          user: { id: user.id },
        });
        await manager.save(
          Caption,
          written.captions.map(({ flavor, text }) => ({
            content: text,
            image: { id },
            flavor: { id: flavor.id },
            llmCall: { id: llmCall.id },
          })),
        );
      });
    } catch (error) {
      // A concurrent request captioned the photo first, and its captions stand
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
    return await this.findOne(id);
  }

  async vote(
    user: UserResDto,
    id: string,
    captionId: string | null,
  ): Promise<Image> {
    const image = await this.findOne(id);
    await this.votesService.vote(user.id, image, captionId);
    return image;
  }

  async remove(user: UserResDto, id: string): Promise<void> {
    const image = await this.findOne(id);
    this.checkCanManage(user, image);

    await this.imageRepository.delete(id);
    if (image.storageKey) {
      await this.s3Service.removeObject(image.storageKey);
    }
  }

  private checkCanManage(user: UserResDto, image: Image): void {
    const isAdmin = user.roles?.includes(Role.Admin) ?? false;
    if (image.uploader?.id !== user.id && !isAdmin) {
      throw new ForbiddenException('This is not your photo');
    }
  }
}
