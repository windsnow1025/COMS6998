import { ImageResDto } from '../../images/dto/image.res.dto';

export class CaptionResDto {
  id: number;
  content: string;
  image: ImageResDto;
  createdAt: Date;
}
