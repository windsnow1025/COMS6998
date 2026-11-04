import { ApiProperty } from '@nestjs/swagger';
import { FlavorResDto } from '../../flavors/dto/flavor.res.dto';

// A model FastAPI can call; a provider's API type and a model's name are chosen from this list
export class AdminAvailableModelResDto {
  apiType: string;
  model: string;
}

export class AdminProviderResDto {
  id: string;
  apiType: string;
  enabled: boolean;
  models: number;
}

// A step that runs on a model: the screening, which has no voice, or a chain's step with its voice
export class AdminModelStepResDto {
  @ApiProperty({ type: FlavorResDto, nullable: true })
  flavor: FlavorResDto | null;
  step: string;
}

export class AdminModelResDto {
  id: string;
  providerId: string;
  apiType: string;
  name: string;
  enabled: boolean;
  // A step runs on an enabled model of an enabled provider, so a choice of model needs both flags
  providerEnabled: boolean;
  steps: AdminModelStepResDto[];
}

// The product's own step before any chain, with the prompts it runs; the user prompt carries the uploader's note as a
// placeholder
export class AdminScreeningResDto {
  step: string;
  modelId: string;
  model: string;
  apiType: string;
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
}

export class AdminTermResDto {
  id: string;
  term: string;
  meaning: string;
  @ApiProperty({ type: String, nullable: true })
  example: string | null;
  createdAt: Date;
}

export class AdminExampleResDto {
  id: string;
  flavor: FlavorResDto;
  description: string;
  caption: string;
  createdAt: Date;
}

// One request to the LLM, as the generation requests and the LLM responses lists show it
export class AdminLlmCallSummaryResDto {
  id: string;
  imageId: string;
  imageUrl: string;
  @ApiProperty({ type: Number, nullable: true })
  userId: number | null;
  @ApiProperty({ type: String, nullable: true })
  username: string | null;
  // The voice whose chain step made the request; null for the screening
  @ApiProperty({ type: FlavorResDto, nullable: true })
  flavor: FlavorResDto | null;
  step: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  createdAt: Date;
  // The response's first characters on one line
  responseExcerpt: string;
}

export class AdminLlmCallPageResDto {
  total: number;
  calls: AdminLlmCallSummaryResDto[];
}

// Whether sign-up is limited to the listed domains and addresses
export class AdminAccessPolicyResDto {
  restricted: boolean;
}

export class AdminDomainResDto {
  id: string;
  domain: string;
  createdAt: Date;
}

export class AdminEmailResDto {
  id: string;
  email: string;
  createdAt: Date;
}
