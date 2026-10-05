import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { FlavorResDto } from './dto/flavor.res.dto';
import { FlavorsService } from './flavors.service';

@Controller('flavors')
export class FlavorsController {
  constructor(private readonly flavorsService: FlavorsService) {}

  @Public()
  @Get()
  async findAll(): Promise<FlavorResDto[]> {
    const flavors = await this.flavorsService.findAll();
    return flavors.map((flavor) => this.flavorsService.toFlavorDto(flavor));
  }
}
