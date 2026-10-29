import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { LlmStep } from '../llm/llm-call.entity';
import { AdminConfigService } from './admin-config.service';
import {
  AdminChainReqDto,
  AdminDomainReqDto,
  AdminEmailReqDto,
  AdminExampleReqDto,
  AdminLlmCallsReqDto,
  AdminModelReqDto,
  AdminModelUpdateReqDto,
  AdminProviderReqDto,
  AdminProviderUpdateReqDto,
  AdminStepReqDto,
  AdminTermReqDto,
} from './dto/admin-config.req.dto';
import {
  AdminAvailableModelResDto,
  AdminChainResDto,
  AdminDomainResDto,
  AdminEmailResDto,
  AdminExampleResDto,
  AdminLlmCallPageResDto,
  AdminModelResDto,
  AdminPipelineStepResDto,
  AdminProviderResDto,
  AdminTermResDto,
} from './dto/admin-config.res.dto';

// The prompt chain and what feeds it, and who may sign up
@Controller('admin')
export class AdminConfigController {
  constructor(private readonly adminConfigService: AdminConfigService) {}

  @Get('chains')
  @Roles([Role.Admin])
  async findChains(): Promise<AdminChainResDto[]> {
    return await this.adminConfigService.findChains();
  }

  @Patch('chains/:slug')
  @Roles([Role.Admin])
  async updateChain(
    @Param('slug') slug: string,
    @Body() dto: AdminChainReqDto,
  ): Promise<AdminChainResDto> {
    return await this.adminConfigService.updateChain(slug, dto.inMix);
  }

  @Get('steps')
  @Roles([Role.Admin])
  async findSteps(): Promise<AdminPipelineStepResDto[]> {
    return await this.adminConfigService.findSteps();
  }

  @Patch('steps/:step')
  @Roles([Role.Admin])
  async updateStep(
    @Param('step', new ParseEnumPipe(LlmStep)) step: LlmStep,
    @Body() dto: AdminStepReqDto,
  ): Promise<AdminPipelineStepResDto> {
    return await this.adminConfigService.updateStep(step, dto);
  }

  @Get('available-models')
  @Roles([Role.Admin])
  async findAvailableModels(): Promise<AdminAvailableModelResDto[]> {
    return await this.adminConfigService.findAvailableModels();
  }

  @Get('providers')
  @Roles([Role.Admin])
  async findProviders(): Promise<AdminProviderResDto[]> {
    return await this.adminConfigService.findProviders();
  }

  @Post('providers')
  @Roles([Role.Admin])
  async createProvider(
    @Body() dto: AdminProviderReqDto,
  ): Promise<AdminProviderResDto> {
    return await this.adminConfigService.createProvider(dto);
  }

  @Patch('providers/:id')
  @Roles([Role.Admin])
  async updateProvider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminProviderUpdateReqDto,
  ): Promise<AdminProviderResDto> {
    return await this.adminConfigService.updateProvider(id, dto);
  }

  @Delete('providers/:id')
  @Roles([Role.Admin])
  async removeProvider(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.adminConfigService.removeProvider(id);
  }

  @Get('models')
  @Roles([Role.Admin])
  async findModels(): Promise<AdminModelResDto[]> {
    return await this.adminConfigService.findModels();
  }

  @Post('models')
  @Roles([Role.Admin])
  async createModel(@Body() dto: AdminModelReqDto): Promise<AdminModelResDto> {
    return await this.adminConfigService.createModel(dto);
  }

  @Patch('models/:id')
  @Roles([Role.Admin])
  async updateModel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminModelUpdateReqDto,
  ): Promise<AdminModelResDto> {
    return await this.adminConfigService.updateModel(id, dto);
  }

  @Delete('models/:id')
  @Roles([Role.Admin])
  async removeModel(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.adminConfigService.removeModel(id);
  }

  @Get('terms')
  @Roles([Role.Admin])
  async findTerms(): Promise<AdminTermResDto[]> {
    return await this.adminConfigService.findTerms();
  }

  @Post('terms')
  @Roles([Role.Admin])
  async createTerm(@Body() dto: AdminTermReqDto): Promise<AdminTermResDto> {
    return await this.adminConfigService.createTerm(dto);
  }

  @Patch('terms/:id')
  @Roles([Role.Admin])
  async updateTerm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminTermReqDto,
  ): Promise<AdminTermResDto> {
    return await this.adminConfigService.updateTerm(id, dto);
  }

  @Delete('terms/:id')
  @Roles([Role.Admin])
  async removeTerm(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.adminConfigService.removeTerm(id);
  }

  @Get('examples')
  @Roles([Role.Admin])
  async findExamples(): Promise<AdminExampleResDto[]> {
    return await this.adminConfigService.findExamples();
  }

  @Post('examples')
  @Roles([Role.Admin])
  async createExample(
    @Body() dto: AdminExampleReqDto,
  ): Promise<AdminExampleResDto> {
    return await this.adminConfigService.createExample(
      dto.flavorSlug,
      dto.description,
      dto.caption,
    );
  }

  @Patch('examples/:id')
  @Roles([Role.Admin])
  async updateExample(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminExampleReqDto,
  ): Promise<AdminExampleResDto> {
    return await this.adminConfigService.updateExample(
      id,
      dto.flavorSlug,
      dto.description,
      dto.caption,
    );
  }

  @Delete('examples/:id')
  @Roles([Role.Admin])
  async removeExample(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.adminConfigService.removeExample(id);
  }

  @Get('llm-calls')
  @Roles([Role.Admin])
  async findLlmCalls(
    @Query(new ValidationPipe({ transform: true }))
    dto: AdminLlmCallsReqDto,
  ): Promise<AdminLlmCallPageResDto> {
    return await this.adminConfigService.findLlmCalls(
      dto.offset,
      dto.limit,
      dto.step,
      dto.q?.trim() || undefined,
    );
  }

  @Get('domains')
  @Roles([Role.Admin])
  async findDomains(): Promise<AdminDomainResDto[]> {
    return await this.adminConfigService.findDomains();
  }

  @Post('domains')
  @Roles([Role.Admin])
  async createDomain(
    @Body() dto: AdminDomainReqDto,
  ): Promise<AdminDomainResDto> {
    return await this.adminConfigService.createDomain(dto.domain);
  }

  @Patch('domains/:id')
  @Roles([Role.Admin])
  async updateDomain(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminDomainReqDto,
  ): Promise<AdminDomainResDto> {
    return await this.adminConfigService.updateDomain(id, dto.domain);
  }

  @Delete('domains/:id')
  @Roles([Role.Admin])
  async removeDomain(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.adminConfigService.removeDomain(id);
  }

  @Get('emails')
  @Roles([Role.Admin])
  async findEmails(): Promise<AdminEmailResDto[]> {
    return await this.adminConfigService.findEmails();
  }

  @Post('emails')
  @Roles([Role.Admin])
  async createEmail(@Body() dto: AdminEmailReqDto): Promise<AdminEmailResDto> {
    return await this.adminConfigService.createEmail(dto.email);
  }

  @Patch('emails/:id')
  @Roles([Role.Admin])
  async updateEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminEmailReqDto,
  ): Promise<AdminEmailResDto> {
    return await this.adminConfigService.updateEmail(id, dto.email);
  }

  @Delete('emails/:id')
  @Roles([Role.Admin])
  async removeEmail(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.adminConfigService.removeEmail(id);
  }
}
