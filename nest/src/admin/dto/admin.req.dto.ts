import { Type } from 'class-transformer';
import {
  IsBoolean,
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
// The length of the user table's username and name columns
export const MaxUserFieldLength = 255;

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

// A user's fields an admin may change; the email is the sign-in's and stays
export class AdminUserReqDto {
  @IsString()
  @Length(1, MaxUserFieldLength)
  username: string;

  // An empty string clears the name
  @IsString()
  @MaxLength(MaxUserFieldLength)
  firstName: string;

  @IsString()
  @MaxLength(MaxUserFieldLength)
  lastName: string;

  // Whether the user has the admin role
  @IsBoolean()
  admin: boolean;
}

export class AdminCaptionReqDto {
  @IsString()
  @Length(1, MaxCaptionLength)
  content: string;
}
