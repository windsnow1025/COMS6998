import { ApiProperty } from '@nestjs/swagger';
import { PhotoResDto } from '../../images/dto/photo.res.dto';

export class BatchResDto {
  // The campus date, as YYYY-MM-DD
  date: string;
  // Whether the date has passed, which reveals every photo to anonymous viewers
  closed: boolean;
  // The campus date of the stored batch before this one; null for the earliest
  @ApiProperty({ type: String, nullable: true })
  previousDate: string | null;
  // The campus date of the stored batch after this one, up to today's; null for the latest
  @ApiProperty({ type: String, nullable: true })
  nextDate: string | null;
  // The batch's photos as the viewer's feed: a photo carried over that the viewer judged before the batch's date is left out
  photos: PhotoResDto[];
  // The batch's photos the viewer judged before its date, in the batch's order, which stay in the batch for the other viewers
  judgedBefore: PhotoResDto[];
}

export class BatchSummaryResDto {
  // The campus date, as YYYY-MM-DD
  date: string;
  photoCount: number;
  // The first photo's URL; null for a batch without photos
  @ApiProperty({ type: String, nullable: true })
  coverUrl: string | null;
}
