import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';
import { FlavorResDto } from '../../flavors/dto/flavor.res.dto';

export class AdminTotalsResDto {
  users: number;
  photos: number;
  // Photos with no caption: the generation failed or was abandoned after the upload
  photosWithoutCaptions: number;
  captions: number;
  // Up votes: a user picked the caption
  picks: number;
  // Down-vote rows: a user rejecting every caption of a photo writes one per caption
  downs: number;
  batches: number;
  llmCalls: number;
}

export class AdminDayResDto {
  // A campus date
  date: string;
  // Users who voted on the date
  voters: number;
  picks: number;
  uploads: number;
  captions: number;
}

export class AdminVoiceResDto {
  slug: string;
  name: string;
  captions: number;
  picks: number;
  downs: number;
}

export class AdminLlmStepResDto {
  step: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  averageDurationMs: number;
}

export class AdminOverviewResDto {
  totals: AdminTotalsResDto;
  // The last campus dates, oldest first
  days: AdminDayResDto[];
  // The voices in their display order
  voices: AdminVoiceResDto[];
  llmSteps: AdminLlmStepResDto[];
}

export class AdminUserResDto {
  id: number;
  username: string;
  email: string;
  @ApiProperty({ enum: Role, isArray: true, nullable: true })
  roles: Role[] | null;
  createdAt: Date;
  // Photos the user uploaded
  photos: number;
  // Photos the user voted on
  photosJudged: number;
  // The user's latest upload or vote; null before the first
  @ApiProperty({ type: Date, nullable: true })
  lastActiveAt: Date | null;
}

export class AdminPhotoUploaderResDto {
  id: number;
  username: string;
}

export class AdminPhotoResDto {
  id: string;
  url: string;
  description: string;
  @ApiProperty({ type: String, nullable: true })
  place: string | null;
  @ApiProperty({ type: AdminPhotoUploaderResDto, nullable: true })
  uploader: AdminPhotoUploaderResDto | null;
  createdAt: Date;
  // The campus date of the latest batch that serves the photo; null while the photo waits in line
  @ApiProperty({ type: String, nullable: true })
  latestBatchDate: string | null;
  captions: number;
  voters: number;
  picks: number;
}

export class AdminPhotoPageResDto {
  total: number;
  photos: AdminPhotoResDto[];
}

export class AdminCaptionResDto {
  id: string;
  content: string;
  @ApiProperty({ type: FlavorResDto, nullable: true })
  flavor: FlavorResDto | null;
  picks: number;
  downs: number;
  // The LLM request that wrote the caption, for GET /admin/llm-calls/:id; null for a caption no LLM wrote
  @ApiProperty({ type: String, nullable: true })
  llmCallId: string | null;
  createdAt: Date;
}

export class AdminVoteUserResDto {
  id: number;
  username: string;
}

export class AdminPhotoVoteResDto {
  id: string;
  user: AdminVoteUserResDto;
  captionId: string;
  value: number;
  createdAt: Date;
}

export class AdminPhotoDetailResDto {
  id: string;
  url: string;
  description: string;
  @ApiProperty({ type: String, nullable: true })
  place: string | null;
  @ApiProperty({ type: AdminPhotoUploaderResDto, nullable: true })
  uploader: AdminPhotoUploaderResDto | null;
  createdAt: Date;
  // The campus dates of the batches that served the photo, oldest first
  batchDates: string[];
  captions: AdminCaptionResDto[];
  // The photo's votes, newest first
  votes: AdminPhotoVoteResDto[];
}

export class AdminVoteResDto {
  id: string;
  user: AdminVoteUserResDto;
  imageId: string;
  imageUrl: string;
  captionId: string;
  captionContent: string;
  value: number;
  createdAt: Date;
}

export class AdminVotePageResDto {
  total: number;
  votes: AdminVoteResDto[];
}

export class AdminLlmCallResDto {
  id: string;
  imageId: string;
  @ApiProperty({ type: Number, nullable: true })
  userId: number | null;
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
