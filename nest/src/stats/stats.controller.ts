import { Controller, Get, Req } from '@nestjs/common';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { StatsResDto } from './dto/stats.res.dto';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('mine')
  async findMine(@Req() req: RequestWithUser): Promise<StatsResDto> {
    return await this.statsService.findByUser(req.user);
  }
}
