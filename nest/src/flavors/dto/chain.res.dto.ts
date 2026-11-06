import { ApiProperty } from '@nestjs/swagger';
import { RunStatus } from '../chain-run.entity';
import { StepInput, StepOutput } from '../prompt-step.entity';

export class StepResDto {
  id: string;
  position: number;
  name: string;
  @ApiProperty({ enum: StepInput })
  input: StepInput;
  @ApiProperty({ enum: StepOutput })
  output: StepOutput;
  systemPrompt: string;
  userPrompt: string;
  modelId: string;
  model: string;
  apiType: string;
}

// A voice as a prompt chain, with its steps in order
export class ChainResDto {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  color: string;
  position: number;
  // Whether new photos get a caption in the voice
  inMix: boolean;
  // The voice's share of new photos against the other voices in the mix
  weight: number;
  // Whether the chain ends with a step that writes captions, which the mix needs
  writesCaptions: boolean;
  // Captions written in the voice for the product
  captions: number;
  // Runs of the chain from the chain tool
  runs: number;
  steps: StepResDto[];
  createdAt: Date;
}

// A placeholder a step's prompt may carry
export class PlaceholderResDto {
  placeholder: string;
  meaning: string;
}

export class RunPhotoResDto {
  id: string;
  url: string;
  description: string;
  @ApiProperty({ type: String, nullable: true })
  place: string | null;
}

export class RunUserResDto {
  id: number;
  username: string;
}

// One request of a run, with its prompts as they were sent
export class RunCallResDto {
  id: string;
  step: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  createdAt: Date;
}

// A run of the chain on a photo
export class RunSummaryResDto {
  id: string;
  @ApiProperty({ enum: RunStatus })
  status: RunStatus;
  photo: RunPhotoResDto;
  @ApiProperty({ type: RunUserResDto, nullable: true })
  user: RunUserResDto | null;
  @ApiProperty({ enum: StepOutput })
  outputType: StepOutput;
  // The chain's step count when the run started
  stepCount: number;
  // The final step's captions, once the run succeeded with a captions step; null otherwise
  @ApiProperty({ type: [String], nullable: true })
  captions: string[] | null;
  // The final step's text, once the run succeeded with a text step; null otherwise
  @ApiProperty({ type: String, nullable: true })
  text: string | null;
  @ApiProperty({ type: String, nullable: true })
  error: string | null;
  createdAt: Date;
  @ApiProperty({ type: Date, nullable: true })
  finishedAt: Date | null;
}

export class RunResDto extends RunSummaryResDto {
  // The steps' requests so far, in the chain's order
  calls: RunCallResDto[];
}

export class RunPageResDto {
  total: number;
  runs: RunSummaryResDto[];
}

// A caption the chain wrote for the product
export class ChainCaptionResDto {
  id: string;
  content: string;
  // Whether voters see the caption
  kept: boolean;
  picks: number;
  photo: RunPhotoResDto;
  createdAt: Date;
}

export class ChainCaptionPageResDto {
  total: number;
  captions: ChainCaptionResDto[];
}
