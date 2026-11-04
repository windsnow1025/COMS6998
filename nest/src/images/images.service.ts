import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
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
import {
  ChainOutcome,
  ChainRunnerService,
} from '../flavors/chain-runner.service';
import { FlavorsService } from '../flavors/flavors.service';
import { HumorFlavor } from '../flavors/humor-flavor.entity';
import { LlmBusyException } from '../llm/llm.client';
import { LlmCall } from '../llm/llm-call.entity';
import { CaptionsPerPhoto, MaxCaptionLength } from '../llm/llm.constants';
import { RoastQuotaService } from '../llm/roast-quota.service';
import { PhotoScreening, RoastService } from '../llm/roast.service';
import { UserResDto } from '../users/dto/user.res.dto';
import { VotesService } from '../votes/votes.service';
import { detectImageType } from './image-type';
import { Image } from './image.entity';
import { PhotosService } from './photos.service';

// A caption a voice's chain wrote for a photo, with the request that wrote it
interface WrittenCaption {
  flavor: HumorFlavor;
  text: string;
  llmCall: LlmCall;
}

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
    private readonly chainRunner: ChainRunnerService,
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
  // A seed photo has no uploader; the batches serve it when no upload of a user waits.
  // `authorization` is the Authorization header of the user's request.
  async create(
    user: UserResDto,
    file: Express.Multer.File,
    place: string | null,
    seed: boolean,
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
          uploader: seed ? null : { id: user.id },
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

    const flavors = await this.flavorsService.findWriters();
    const voices = this.flavorsService.pickLeastUsed(
      flavors,
      await this.flavorsService.countKeptCaptions(),
      CaptionsPerPhoto,
    );
    const written = await this.writeInVoices(
      image,
      voices,
      user,
      authorization,
    );
    await this.saveCaptions(id, written, true);
    return await this.findOne(id);
  }

  // Writes the photo's drafts once, one in every voice of the mix, of which the uploader keeps 3 as its captions:
  // a photo that has captions keeps them. `authorization` is the Authorization header of the user's request.
  async writeDrafts(
    user: UserResDto,
    id: string,
    authorization: string,
  ): Promise<Image> {
    const image = await this.findOne(id);
    this.checkCanManage(user, image);
    if (image.captions.length > 0) {
      return image;
    }

    const flavors = await this.flavorsService.findWriters();
    const written = await this.writeInVoices(
      image,
      flavors,
      user,
      authorization,
    );
    await this.saveCaptions(id, written, false);
    return await this.findOne(id);
  }

  // Keeps the given drafts as the photo's captions and the rest out of sight. The kept captions can change
  // until a batch serves the photo; from then on its voters vote on them, so they stay.
  async keepCaptions(
    user: UserResDto,
    id: string,
    captionIds: string[],
  ): Promise<Image> {
    const image = await this.findOne(id);
    this.checkCanManage(user, image);
    if (new Set(captionIds).size !== captionIds.length) {
      throw new BadRequestException('Keep different captions');
    }
    const draftIds = new Set(image.captions.map(({ id }) => id));
    if (!captionIds.every((captionId) => draftIds.has(captionId))) {
      throw new BadRequestException('A caption is not one of this photo');
    }

    // One statement checks that no batch serves the photo and updates its captions
    const result = await this.dataSource
      .createQueryBuilder()
      .update(Caption)
      .set({ kept: () => 'id IN (:...captionIds)' })
      .where('"imageId" = :id')
      .andWhere(
        'NOT EXISTS (SELECT 1 FROM daily_batch_item WHERE daily_batch_item."imageId" = :id)',
      )
      .setParameters({ id, captionIds })
      .execute();
    if (result.affected === 0) {
      throw new ConflictException(
        'A batch serves this photo, so its captions stay as they are',
      );
    }
    return await this.findOne(id);
  }

  async vote(
    user: UserResDto,
    id: string,
    captionId: string | null,
  ): Promise<Image> {
    const image = await this.findOne(id);
    if (await this.photosService.isClosed(id)) {
      throw new ConflictException('Voting on this photo ended with its batch');
    }
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

  // One caption per voice, the first its chain writes; every chain runs at once, and its requests are recorded as they
  // complete (ChainRunnerService)
  private async writeInVoices(
    image: Image,
    voices: HumorFlavor[],
    user: UserResDto,
    authorization: string,
  ): Promise<WrittenCaption[]> {
    const photo = {
      id: image.id,
      url: image.url,
      description: image.description,
      place: image.place,
    };
    const outcomes = await Promise.allSettled(
      voices.map((voice) =>
        this.chainRunner.run(voice, photo, user, authorization, null),
      ),
    );
    const failures = outcomes.filter(
      (outcome): outcome is PromiseRejectedResult =>
        outcome.status === 'rejected',
    );
    if (failures.length > 0) {
      // A provider that cannot answer now is reported over any other failure, since the user can try again
      const busy = failures.find(
        (failure) => failure.reason instanceof LlmBusyException,
      );
      throw busy ? busy.reason : failures[0].reason;
    }
    return voices.map((flavor, index) => {
      const { value } = outcomes[index] as PromiseFulfilledResult<ChainOutcome>;
      const text = value.captions?.[0];
      if (!text || text.length > MaxCaptionLength) {
        throw new Error(
          `The chain of the voice "${flavor.slug}" wrote no caption of at most ${MaxCaptionLength} characters`,
        );
      }
      return { flavor, text, llmCall: value.calls[value.calls.length - 1] };
    });
  }

  private async saveCaptions(
    id: string,
    written: WrittenCaption[],
    kept: boolean,
  ): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.save(
          Caption,
          written.map(({ flavor, text, llmCall }) => ({
            content: text,
            image: { id },
            flavor: { id: flavor.id },
            llmCall: { id: llmCall.id },
            kept,
          })),
        );
      });
    } catch (error) {
      // A concurrent request captioned the photo first, and its captions stand
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  private checkCanManage(user: UserResDto, image: Image): void {
    const isAdmin = user.roles?.includes(Role.Admin) ?? false;
    if (image.uploader?.id !== user.id && !isAdmin) {
      throw new ForbiddenException('This is not your photo');
    }
  }
}
