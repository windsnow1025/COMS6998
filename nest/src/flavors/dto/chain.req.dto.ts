import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

// A hex triplet, as the product's styles take a voice's color
const ColorPattern = /^#[0-9a-f]{6}$/;
import {
  MaxPromptLength,
  MaxStepNameLength,
  StepInput,
  StepOutput,
} from '../prompt-step.entity';
import { MaxWeight } from '../humor-flavor.entity';

export class ChainReqDto {
  // Lower-case letters, digits, and hyphens; set at creation
  @IsString()
  @Length(1, 32)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  slug: string;

  @IsString()
  @Length(1, 64)
  name: string;

  @IsString()
  @Length(1, 160)
  tagline: string;

  @Matches(ColorPattern)
  color: string;

  @IsInt()
  @Min(1)
  @Max(MaxWeight)
  weight: number;
}

export class ChainUpdateReqDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  tagline?: string;

  @IsOptional()
  @Matches(ColorPattern)
  color?: string;

  @IsOptional()
  @IsBoolean()
  inMix?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MaxWeight)
  weight?: number;
}

export class StepReqDto {
  @IsString()
  @Length(1, MaxStepNameLength)
  name: string;

  @IsEnum(StepInput)
  input: StepInput;

  @IsEnum(StepOutput)
  output: StepOutput;

  @IsString()
  @Length(1, MaxPromptLength)
  systemPrompt: string;

  @IsString()
  @Length(1, MaxPromptLength)
  userPrompt: string;

  @IsUUID()
  modelId: string;
}

// The chain's steps in their new order, every step of the chain once
export class StepOrderReqDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  stepIds: string[];
}

export class RunReqDto {
  @IsUUID()
  imageId: string;
}

export class PageReqDto {
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
