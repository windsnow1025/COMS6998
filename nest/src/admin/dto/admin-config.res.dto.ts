import { ApiProperty } from '@nestjs/swagger';
import { FlavorResDto } from '../../flavors/dto/flavor.res.dto';

// A step of the prompt chain as it runs now: its model and the prompts it is sent
export class AdminStepResDto {
  step: string;
  apiType: string;
  modelId: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  // The user prompt with the photo's parts as placeholders
  userPrompt: string;
}

// A voice as a prompt chain: the photo is described, and the description is captioned in the voice
export class AdminChainResDto {
  slug: string;
  name: string;
  tagline: string;
  position: number;
  // Whether new photos get a caption in the voice
  inMix: boolean;
  // The voice's instruction inside the caption step's system prompt
  prompt: string;
  // Kept captions written in the voice
  captions: number;
  steps: AdminStepResDto[];
}

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

export class AdminModelResDto {
  id: string;
  providerId: string;
  apiType: string;
  name: string;
  enabled: boolean;
  // The pipeline steps that run on the model
  steps: string[];
}

export class AdminPipelineStepResDto {
  step: string;
  modelId: string;
  model: string;
  apiType: string;
  temperature: number;
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
