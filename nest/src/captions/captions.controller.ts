import { Controller, Get } from '@nestjs/common';
import { CaptionsService } from './captions.service';
import { CaptionResDto } from './dto/caption.res.dto';

@Controller('captions')
export class CaptionsController {
  constructor(private readonly captionsService: CaptionsService) {}

  @Get()
  async findAll(): Promise<CaptionResDto[]> {
    const captions = await this.captionsService.findAll();
    return captions.map((caption) =>
      this.captionsService.toCaptionDto(caption),
    );
  }
}
