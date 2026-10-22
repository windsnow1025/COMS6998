import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CaptionsPerPhoto } from '../../llm/llm.constants';

export const MaxPlaceLength = 80;

export class PhotoCreateReqDto {
  @IsOptional()
  @IsString()
  @MaxLength(MaxPlaceLength)
  place?: string;
}

// The drafts that the uploader keeps as the photo's captions. Their being different is checked by the service:
// `ArrayUnique` would mark the array's items unique in the OpenAPI document, which the generated client types as a Set.
export class KeptCaptionsReqDto {
  @IsArray()
  @ArrayMinSize(CaptionsPerPhoto)
  @ArrayMaxSize(CaptionsPerPhoto)
  @IsUUID('all', { each: true })
  captionIds: string[];
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
