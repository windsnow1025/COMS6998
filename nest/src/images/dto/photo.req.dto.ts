import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export const MaxPlaceLength = 80;

export class PhotoCreateReqDto {
  @IsOptional()
  @IsString()
  @MaxLength(MaxPlaceLength)
  place?: string;
}

export const TopRanges = ['week', 'all'] as const;
export type TopRange = (typeof TopRanges)[number];

export class TopPhotosReqDto {
  @IsIn(TopRanges)
  range: TopRange;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number;
}
