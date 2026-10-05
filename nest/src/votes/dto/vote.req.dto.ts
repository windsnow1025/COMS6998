import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

export class VoteReqDto {
  // The picked caption, or null to reject every caption of the photo
  @ApiProperty({ type: String, nullable: true })
  @ValidateIf((dto: VoteReqDto) => dto.captionId !== null)
  @IsUUID()
  captionId: string | null;
}
