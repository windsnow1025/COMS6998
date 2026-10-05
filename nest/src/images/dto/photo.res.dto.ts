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
  // The campus date of the batch that serves the photo; null while the photo waits in line
  @ApiProperty({ type: String, nullable: true })
  batchDate: string | null;
  // The photo's place in line for a batch; present for the uploader of a waiting photo
  queuePosition?: number;
  createdAt: Date;
  captions: PhotoCaptionResDto[];
  // Whether the results are shown: each caption's flavor and picks, the voters, and the none picks
  revealed: boolean;
  voters?: number;
  nonePicks?: number;
  viewer: PhotoViewerResDto;
}
