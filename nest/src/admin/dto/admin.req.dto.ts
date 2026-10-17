import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MaxCaptionLength } from '../../llm/llm.constants';

export const MaxSearchLength = 160;

export class AdminPhotosReqDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number;

  // Matches a photo's description, its place, or a caption's text
  @IsOptional()
  @IsString()
  @MaxLength(MaxSearchLength)
  q?: string;
}

export class AdminVotesReqDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number;
}

export class AdminCaptionReqDto {
  @IsString()
  @Length(1, MaxCaptionLength)
  content: string;
}
