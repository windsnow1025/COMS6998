import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ChainsService } from './chains.service';
import {
  ChainReqDto,
  ChainUpdateReqDto,
  PageReqDto,
  RunReqDto,
  StepOrderReqDto,
  StepReqDto,
} from './dto/chain.req.dto';
import {
  ChainCaptionPageResDto,
  ChainResDto,
  PlaceholderResDto,
  RunPageResDto,
  RunResDto,
} from './dto/chain.res.dto';

// The voices as prompt chains, for the chain tool: their steps, runs of them on photos, and what they wrote
@Controller('chains')
export class ChainsController {
  constructor(private readonly chainsService: ChainsService) {}

  @Get()
  @Roles([Role.Admin])
  async findAll(): Promise<ChainResDto[]> {
    return await this.chainsService.findChains();
  }

  @Post()
  @Roles([Role.Admin])
  async create(@Body() dto: ChainReqDto): Promise<ChainResDto> {
    return await this.chainsService.createChain(dto);
  }

  // The placeholders a step's prompt may carry
  @Get('placeholders')
  @Roles([Role.Admin])
  findPlaceholders(): PlaceholderResDto[] {
    return this.chainsService.findPlaceholders();
  }

  @Get(':id')
  @Roles([Role.Admin])
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ChainResDto> {
    return await this.chainsService.findChain(id);
  }

  @Patch(':id')
  @Roles([Role.Admin])
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChainUpdateReqDto,
  ): Promise<ChainResDto> {
    return await this.chainsService.updateChain(id, dto);
  }

  @Delete(':id')
  @Roles([Role.Admin])
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.chainsService.removeChain(id);
  }

  // Appends a step at the chain's end
  @Post(':id/steps')
  @Roles([Role.Admin])
  async addStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StepReqDto,
  ): Promise<ChainResDto> {
    return await this.chainsService.addStep(id, dto);
  }

  @Put(':id/steps/order')
  @Roles([Role.Admin])
  async reorderSteps(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StepOrderReqDto,
  ): Promise<ChainResDto> {
    return await this.chainsService.reorderSteps(id, dto.stepIds);
  }

  @Patch(':id/steps/:stepId')
  @Roles([Role.Admin])
  async updateStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: StepReqDto,
  ): Promise<ChainResDto> {
    return await this.chainsService.updateStep(id, stepId, dto);
  }

  @Delete(':id/steps/:stepId')
  @Roles([Role.Admin])
  async removeStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ): Promise<ChainResDto> {
    return await this.chainsService.removeStep(id, stepId);
  }

  // Starts a run of the chain on a photo of the library; the run's steps complete after the answer
  @Post(':id/runs')
  @Roles([Role.Admin])
  @HttpCode(HttpStatus.ACCEPTED)
  async createRun(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RunReqDto,
  ): Promise<RunResDto> {
    return await this.chainsService.createRun(
      id,
      dto.imageId,
      req.user,
      req.headers.authorization!,
    );
  }

  @Get(':id/runs')
  @Roles([Role.Admin])
  async findRuns(
    @Param('id', ParseUUIDPipe) id: string,
    @Query(new ValidationPipe({ transform: true })) page: PageReqDto,
  ): Promise<RunPageResDto> {
    return await this.chainsService.findRuns(id, page.limit, page.offset);
  }

  @Get(':id/runs/:runId')
  @Roles([Role.Admin])
  async findRun(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('runId', ParseUUIDPipe) runId: string,
  ): Promise<RunResDto> {
    return await this.chainsService.findRun(id, runId);
  }

  // The captions the chain wrote for the product, newest first
  @Get(':id/captions')
  @Roles([Role.Admin])
  async findCaptions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query(new ValidationPipe({ transform: true })) page: PageReqDto,
  ): Promise<ChainCaptionPageResDto> {
    return await this.chainsService.findCaptions(id, page.limit, page.offset);
  }
}
