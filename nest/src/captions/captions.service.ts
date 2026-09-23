import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caption } from './caption.entity';
import { CaptionResDto } from './dto/caption.res.dto';

@Injectable()
export class CaptionsService {
  constructor(
    @InjectRepository(Caption)
    private readonly captionRepository: Repository<Caption>,
  ) {}

  public toCaptionDto(caption: Caption): CaptionResDto {
    return {
      id: caption.id,
      content: caption.content,
      image: {
        id: caption.image.id,
        url: caption.image.url,
        description: caption.image.description,
      },
      createdAt: caption.createdAt,
    };
  }

  async findAll(): Promise<Caption[]> {
    return await this.captionRepository.find({
      relations: { image: true },
      order: { createdAt: 'DESC' },
    });
  }
}
