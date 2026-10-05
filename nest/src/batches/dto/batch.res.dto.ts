import { ApiProperty } from '@nestjs/swagger';
import { PhotoResDto } from '../../images/dto/photo.res.dto';

export class BatchResDto {
  // The campus date, as YYYY-MM-DD
  date: string;
  // Whether the date has passed, which reveals every photo to anonymous viewers
  closed: boolean;
  photos: PhotoResDto[];
}

export class BatchSummaryResDto {
  // The campus date, as YYYY-MM-DD
  date: string;
  photoCount: number;
  // The first photo's URL; null for a batch without photos
  @ApiProperty({ type: String, nullable: true })
  coverUrl: string | null;
}
