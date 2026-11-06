import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MaxWeight } from '../../flavors/humor-flavor.entity';
import { MaxStepNameLength } from '../../flavors/prompt-step.entity';
import { MaxCaptionLength } from '../../llm/llm.constants';
import { MaxSearchLength } from './admin.req.dto';

// A voice's place in the mix and its weight there
export class AdminChainReqDto {
  @IsOptional()
  @IsBoolean()
  inMix?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MaxWeight)
  weight?: number;
}

export class AdminProviderReqDto {
  @IsString()
  @Length(1, 64)
  apiType: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class AdminProviderUpdateReqDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  apiType?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class AdminModelReqDto {
  @IsUUID()
  providerId: string;

  @IsString()
  @Length(1, 64)
  name: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class AdminModelUpdateReqDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  name?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class AdminPipelineStepReqDto {
  @IsUUID()
  modelId: string;
}

export class AdminTermReqDto {
  @IsString()
  @Length(1, 64)
  term: string;

  @IsString()
  @Length(1, 2000)
  meaning: string;

  // An empty string clears the example
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  example?: string;
}

export class AdminExampleReqDto {
  @IsString()
  @Length(1, 32)
  flavorSlug: string;

  @IsString()
  @Length(1, 4000)
  description: string;

  @IsString()
  @Length(1, MaxCaptionLength)
  caption: string;
}

export class AdminLlmCallsReqDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number;

  // The name of one of the product's own steps or of a chain step
  @IsOptional()
  @IsString()
  @MaxLength(MaxStepNameLength)
  step?: string;

  // Matches the response's text
  @IsOptional()
  @IsString()
  @MaxLength(MaxSearchLength)
  q?: string;
}

export class AdminAccessPolicyReqDto {
  @IsBoolean()
  restricted: boolean;
}

export class AdminDomainReqDto {
  @IsString()
  @Length(1, 255)
  domain: string;
}

export class AdminEmailReqDto {
  @IsEmail()
  @MaxLength(255)
  email: string;
}

export class AdminPhotoReqDto {
  @IsOptional()
  @IsString()
  @Length(1, 4000)
  description?: string;

  // An empty string clears the place
  @IsOptional()
  @IsString()
  @MaxLength(80)
  place?: string;
}
