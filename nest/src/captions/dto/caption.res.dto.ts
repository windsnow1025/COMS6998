import { ImageResDto } from '../../images/dto/image.res.dto';

export class CaptionResDto {
  id: string;
  content: string;
  image: ImageResDto;
  createdAt: Date;
}
