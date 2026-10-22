import { ApiProperty } from '@nestjs/swagger';
import { FlavorResDto } from '../../flavors/dto/flavor.res.dto';

export class PhotoUploaderResDto {
  name: string;
  avatar?: string;
}

export class PhotoCaptionResDto {
  id: string;
  content: string;
  // Present once the photo is revealed to the viewer
  flavor?: FlavorResDto;
  // Present once the photo is revealed to the viewer
  picks?: number;
}

// A caption in the voice it was written in, among which the uploader keeps the photo's captions
export class PhotoDraftResDto {
  id: string;
  content: string;
  flavor: FlavorResDto;
  kept: boolean;
}

export class PhotoViewerResDto {
  isOwner: boolean;
  hasVoted: boolean;
  // The caption the viewer picked; null when the viewer rejected every caption or has not voted
  @ApiProperty({ type: String, nullable: true })
  captionId: string | null;
  // Whether the picked caption has the most picks; present once enough users have voted
  matched?: boolean;
}

// An image with its LLM-written captions, as one viewer may see it
export class PhotoResDto {
  id: string;
  url: string;
  description: string;
  @ApiProperty({ type: String, nullable: true })
  place: string | null;
  @ApiProperty({ type: PhotoUploaderResDto, nullable: true })
  uploader: PhotoUploaderResDto | null;
  // The campus date of the latest batch that serves the photo; null while the photo waits in line
  @ApiProperty({ type: String, nullable: true })
  batchDate: string | null;
  // The photo's place in line for a batch; present for the uploader of a waiting photo
  queuePosition?: number;
  createdAt: Date;
  // The captions the photo's voters see
  captions: PhotoCaptionResDto[];
  // Every draft of the photo, for its uploader while no batch has served it, so that the kept captions can change;
  // present for a photo whose captions were written as drafts
  drafts?: PhotoDraftResDto[];
  // Whether the results are shown: each caption's flavor and picks, the voters, and the none picks
  revealed: boolean;
  voters?: number;
  nonePicks?: number;
  viewer: PhotoViewerResDto;
}
