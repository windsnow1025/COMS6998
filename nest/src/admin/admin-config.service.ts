import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessService } from '../access/access.service';
import { AllowedDomain } from '../access/allowed-domain.entity';
import { WhitelistedEmail } from '../access/whitelisted-email.entity';
import {
  isForeignKeyViolation,
  isUniqueViolation,
} from '../common/utils/query-error';
import { CaptionExample } from '../flavors/caption-example.entity';
import { FlavorsService } from '../flavors/flavors.service';
import { HumorFlavor } from '../flavors/humor-flavor.entity';
import { Term } from '../flavors/term.entity';
import { LlmCall, LlmStep } from '../llm/llm-call.entity';
import { LlmModel } from '../llm/llm-model.entity';
import { LlmProvider } from '../llm/llm-provider.entity';
import { CaptionsPerPhoto } from '../llm/llm.constants';
import { PipelineStep } from '../llm/pipeline-step.entity';
import {
  buildCaptionSystemPrompt,
  buildCaptionUserPrompt,
  buildDescribeUserPrompt,
  DescribeSystemPrompt,
} from '../llm/roast.prompts';
import {
  AdminModelReqDto,
  AdminModelUpdateReqDto,
  AdminProviderReqDto,
  AdminProviderUpdateReqDto,
  AdminStepReqDto,
  AdminTermReqDto,
} from './dto/admin-config.req.dto';
import {
  AdminChainResDto,
  AdminDomainResDto,
  AdminEmailResDto,
  AdminExampleResDto,
  AdminLlmCallPageResDto,
  AdminLlmCallSummaryResDto,
  AdminModelResDto,
  AdminPipelineStepResDto,
  AdminProviderResDto,
  AdminStepResDto,
  AdminTermResDto,
} from './dto/admin-config.res.dto';
import { escapeLike } from './admin.service';

export const ResponseExcerptLength = 160;

// The response's first characters on one line
export function toExcerpt(response: string): string {
  const collapsed = response.replace(/\s+/g, ' ').trim();
  return collapsed.length > ResponseExcerptLength
    ? `${collapsed.slice(0, ResponseExcerptLength)}…`
    : collapsed;
}

// The admin's view of the prompt chain and what feeds it: the voices and their mix, the pipeline steps with their models and
// providers, the terms and the caption examples, the LLM calls, and who may sign up
@Injectable()
export class AdminConfigService {
  constructor(
    @InjectRepository(HumorFlavor)
    private readonly flavorRepository: Repository<HumorFlavor>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(CaptionExample)
    private readonly exampleRepository: Repository<CaptionExample>,
    @InjectRepository(LlmProvider)
    private readonly providerRepository: Repository<LlmProvider>,
    @InjectRepository(LlmModel)
    private readonly modelRepository: Repository<LlmModel>,
    @InjectRepository(PipelineStep)
    private readonly stepRepository: Repository<PipelineStep>,
    @InjectRepository(LlmCall)
    private readonly llmCallRepository: Repository<LlmCall>,
    private readonly flavorsService: FlavorsService,
    private readonly accessService: AccessService,
  ) {}

  // Chains

  async findChains(): Promise<AdminChainResDto[]> {
    const [flavors, counts, steps] = await Promise.all([
      this.flavorsService.findAll(),
      this.flavorsService.countCaptions(),
      this.findStepDtos(),
    ]);
    return flavors.map((flavor) => ({
      slug: flavor.slug,
      name: flavor.name,
      tagline: flavor.tagline,
      position: flavor.position,
      inMix: flavor.inMix,
      prompt: flavor.prompt,
      captions: counts.get(flavor.id) ?? 0,
      steps,
    }));
  }

  // Takes a voice into the mix or out of it; the mix keeps at least the voices one photo's captions need
  async updateChain(slug: string, inMix: boolean): Promise<AdminChainResDto> {
    const flavor = await this.flavorRepository.findOneBy({ slug });
    if (!flavor) {
      throw new NotFoundException('Voice not found');
    }
    if (!inMix && flavor.inMix) {
      const others = await this.flavorRepository.countBy({ inMix: true });
      if (others - 1 < CaptionsPerPhoto) {
        throw new BadRequestException(
          `The mix keeps at least ${CaptionsPerPhoto} voices`,
        );
      }
    }
    flavor.inMix = inMix;
    await this.flavorRepository.save(flavor);
    const chain = (await this.findChains()).find((row) => row.slug === slug);
    if (!chain) {
      throw new Error(`The voice "${slug}" vanished after its save`);
    }
    return chain;
  }

  // The 2 steps as they run now, with the prompts as the caption step composes them for the mix
  private async findStepDtos(): Promise<AdminStepResDto[]> {
    const [rows, flavors, material] = await Promise.all([
      this.findStepRows(),
      this.flavorsService.findInMix(),
      this.flavorsService.findPromptMaterial(),
    ]);
    const prompts: Record<LlmStep, { system: string; user: string }> = {
      [LlmStep.Describe]: {
        system: DescribeSystemPrompt,
        user: buildDescribeUserPrompt('{place}'),
      },
      [LlmStep.Caption]: {
        system: buildCaptionSystemPrompt(flavors, material),
        user: buildCaptionUserPrompt('{description}', '{place}', flavors),
      },
    };
    return rows.map((row) => ({
      step: row.step,
      provider: row.model.provider.name,
      apiType: row.model.provider.apiType,
      modelId: row.model.id,
      model: row.model.name,
      temperature: row.temperature,
      systemPrompt: prompts[row.step].system,
      userPrompt: prompts[row.step].user,
    }));
  }

  // Pipeline steps

  async findSteps(): Promise<AdminPipelineStepResDto[]> {
    return (await this.findStepRows()).map((row) => this.toStepDto(row));
  }

  async updateStep(
    step: LlmStep,
    dto: AdminStepReqDto,
  ): Promise<AdminPipelineStepResDto> {
    const row = await this.stepRepository.findOne({
      where: { step },
      relations: { model: { provider: true } },
    });
    if (!row) {
      throw new NotFoundException('Pipeline step not found');
    }
    if (dto.modelId !== undefined) {
      const model = await this.modelRepository.findOne({
        where: { id: dto.modelId },
        relations: { provider: true },
      });
      if (!model) {
        throw new NotFoundException('Model not found');
      }
      if (!model.enabled || !model.provider.enabled) {
        throw new BadRequestException(
          'A step runs on an enabled model of an enabled provider',
        );
      }
      row.model = model;
    }
    if (dto.temperature !== undefined) {
      row.temperature = dto.temperature;
    }
    return this.toStepDto(await this.stepRepository.save(row));
  }

  // Providers and models

  async findProviders(): Promise<AdminProviderResDto[]> {
    const providers = await this.providerRepository.find({
      relations: { models: true },
      order: { name: 'ASC' },
    });
    return providers.map((provider) => this.toProviderDto(provider));
  }

  async createProvider(dto: AdminProviderReqDto): Promise<AdminProviderResDto> {
    const provider = this.providerRepository.create({
      name: dto.name.trim(),
      apiType: dto.apiType.trim(),
      enabled: dto.enabled ?? true,
    });
    const saved = await this.saveProvider(provider);
    return this.toProviderDto({ ...saved, models: [] });
  }

  async updateProvider(
    id: string,
    dto: AdminProviderUpdateReqDto,
  ): Promise<AdminProviderResDto> {
    const provider = await this.providerRepository.findOne({
      where: { id },
      relations: { models: true },
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    if (dto.name !== undefined) {
      provider.name = dto.name.trim();
    }
    if (dto.apiType !== undefined) {
      provider.apiType = dto.apiType.trim();
    }
    if (dto.enabled !== undefined) {
      provider.enabled = dto.enabled;
    }
    return this.toProviderDto(await this.saveProvider(provider));
  }

  // Deleting a provider deletes its models; a provider with a model a step runs on stays
  async removeProvider(id: string): Promise<void> {
    try {
      const result = await this.providerRepository.delete(id);
      if (!result.affected) {
        throw new NotFoundException('Provider not found');
      }
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException(
          'A pipeline step runs on a model of this provider',
        );
      }
      throw error;
    }
  }

  async findModels(): Promise<AdminModelResDto[]> {
    const [models, steps] = await Promise.all([
      this.modelRepository.find({
        relations: { provider: true },
        order: { provider: { name: 'ASC' }, name: 'ASC' },
      }),
      this.findStepRows(),
    ]);
    return models.map((model) => this.toModelDto(model, steps));
  }

  async createModel(dto: AdminModelReqDto): Promise<AdminModelResDto> {
    const provider = await this.providerRepository.findOneBy({
      id: dto.providerId,
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    const model = this.modelRepository.create({
      provider,
      name: dto.name.trim(),
      enabled: dto.enabled ?? true,
    });
    return this.toModelDto(await this.saveModel(model), []);
  }

  async updateModel(
    id: string,
    dto: AdminModelUpdateReqDto,
  ): Promise<AdminModelResDto> {
    const model = await this.modelRepository.findOne({
      where: { id },
      relations: { provider: true },
    });
    if (!model) {
      throw new NotFoundException('Model not found');
    }
    if (dto.name !== undefined) {
      model.name = dto.name.trim();
    }
    if (dto.enabled !== undefined) {
      model.enabled = dto.enabled;
    }
    const saved = await this.saveModel(model);
    return this.toModelDto(saved, await this.findStepRows());
  }

  // A model a step runs on stays
  async removeModel(id: string): Promise<void> {
    try {
      const result = await this.modelRepository.delete(id);
      if (!result.affected) {
        throw new NotFoundException('Model not found');
      }
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException('A pipeline step runs on this model');
      }
      throw error;
    }
  }

  // Terms

  async findTerms(): Promise<AdminTermResDto[]> {
    return (await this.flavorsService.findTerms()).map((term) =>
      this.toTermDto(term),
    );
  }

  async createTerm(dto: AdminTermReqDto): Promise<AdminTermResDto> {
    return this.toTermDto(
      await this.saveTerm(this.termRepository.create(), dto),
    );
  }

  async updateTerm(id: string, dto: AdminTermReqDto): Promise<AdminTermResDto> {
    const term = await this.termRepository.findOneBy({ id });
    if (!term) {
      throw new NotFoundException('Term not found');
    }
    return this.toTermDto(await this.saveTerm(term, dto));
  }

  async removeTerm(id: string): Promise<void> {
    const result = await this.termRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Term not found');
    }
  }

  // Caption examples

  async findExamples(): Promise<AdminExampleResDto[]> {
    return (await this.flavorsService.findExamples()).map((example) =>
      this.toExampleDto(example),
    );
  }

  async createExample(
    flavorSlug: string,
    description: string,
    caption: string,
  ): Promise<AdminExampleResDto> {
    const flavor = await this.findFlavor(flavorSlug);
    const example = this.exampleRepository.create({
      flavor,
      description: description.trim(),
      caption: caption.trim(),
    });
    return this.toExampleDto(await this.exampleRepository.save(example));
  }

  async updateExample(
    id: string,
    flavorSlug: string,
    description: string,
    caption: string,
  ): Promise<AdminExampleResDto> {
    const example = await this.exampleRepository.findOne({
      where: { id },
      relations: { flavor: true },
    });
    if (!example) {
      throw new NotFoundException('Example not found');
    }
    example.flavor = await this.findFlavor(flavorSlug);
    example.description = description.trim();
    example.caption = caption.trim();
    return this.toExampleDto(await this.exampleRepository.save(example));
  }

  async removeExample(id: string): Promise<void> {
    const result = await this.exampleRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Example not found');
    }
  }

  // LLM calls: the generation requests and their responses, newest first

  async findLlmCalls(
    offset: number,
    limit: number,
    step: LlmStep | undefined,
    q: string | undefined,
  ): Promise<AdminLlmCallPageResDto> {
    const query = this.llmCallRepository
      .createQueryBuilder('call')
      .leftJoinAndSelect('call.image', 'image')
      .leftJoinAndSelect('call.user', 'user')
      .orderBy('call.createdAt', 'DESC')
      .skip(offset)
      .take(limit);
    if (step) {
      query.andWhere('call.step = :step', { step });
    }
    if (q) {
      query.andWhere('call.response ILIKE :term', {
        term: `%${escapeLike(q)}%`,
      });
    }
    const [calls, total] = await query.getManyAndCount();
    return {
      total,
      calls: calls.map((call): AdminLlmCallSummaryResDto => ({
        id: call.id,
        imageId: call.image.id,
        imageUrl: call.image.url,
        userId: call.user?.id ?? null,
        username: call.user?.username ?? null,
        step: call.step,
        model: call.model,
        inputTokens: call.inputTokens,
        outputTokens: call.outputTokens,
        durationMs: call.durationMs,
        createdAt: call.createdAt,
        responseExcerpt: toExcerpt(call.response),
      })),
    };
  }

  // Sign-up access

  async findDomains(): Promise<AdminDomainResDto[]> {
    return (await this.accessService.findDomains()).map((row) =>
      this.toDomainDto(row),
    );
  }

  async createDomain(domain: string): Promise<AdminDomainResDto> {
    return this.toDomainDto(await this.accessService.createDomain(domain));
  }

  async updateDomain(id: string, domain: string): Promise<AdminDomainResDto> {
    return this.toDomainDto(await this.accessService.updateDomain(id, domain));
  }

  async removeDomain(id: string): Promise<void> {
    await this.accessService.removeDomain(id);
  }

  async findEmails(): Promise<AdminEmailResDto[]> {
    return (await this.accessService.findEmails()).map((row) =>
      this.toEmailDto(row),
    );
  }

  async createEmail(email: string): Promise<AdminEmailResDto> {
    return this.toEmailDto(await this.accessService.createEmail(email));
  }

  async updateEmail(id: string, email: string): Promise<AdminEmailResDto> {
    return this.toEmailDto(await this.accessService.updateEmail(id, email));
  }

  async removeEmail(id: string): Promise<void> {
    await this.accessService.removeEmail(id);
  }

  // Helpers

  private async findStepRows(): Promise<PipelineStep[]> {
    return await this.stepRepository.find({
      relations: { model: { provider: true } },
      order: { step: 'DESC' },
    });
  }

  private async findFlavor(slug: string): Promise<HumorFlavor> {
    const flavor = await this.flavorRepository.findOneBy({ slug });
    if (!flavor) {
      throw new NotFoundException('Voice not found');
    }
    return flavor;
  }

  private async saveProvider(provider: LlmProvider): Promise<LlmProvider> {
    try {
      return await this.providerRepository.save(provider);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'A provider with this name or API type exists',
        );
      }
      throw error;
    }
  }

  private async saveModel(model: LlmModel): Promise<LlmModel> {
    try {
      return await this.modelRepository.save(model);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('The provider has a model of this name');
      }
      throw error;
    }
  }

  private async saveTerm(term: Term, dto: AdminTermReqDto): Promise<Term> {
    term.term = dto.term.trim();
    term.meaning = dto.meaning.trim();
    term.example = dto.example?.trim() || null;
    try {
      return await this.termRepository.save(term);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('The term is already listed');
      }
      throw error;
    }
  }

  private toStepDto(row: PipelineStep): AdminPipelineStepResDto {
    return {
      step: row.step,
      modelId: row.model.id,
      model: row.model.name,
      provider: row.model.provider.name,
      temperature: row.temperature,
    };
  }

  private toProviderDto(provider: LlmProvider): AdminProviderResDto {
    return {
      id: provider.id,
      name: provider.name,
      apiType: provider.apiType,
      enabled: provider.enabled,
      models: provider.models.length,
    };
  }

  private toModelDto(model: LlmModel, steps: PipelineStep[]): AdminModelResDto {
    return {
      id: model.id,
      providerId: model.provider.id,
      provider: model.provider.name,
      apiType: model.provider.apiType,
      name: model.name,
      enabled: model.enabled,
      steps: steps
        .filter((step) => step.model.id === model.id)
        .map((step) => step.step),
    };
  }

  private toTermDto(term: Term): AdminTermResDto {
    return {
      id: term.id,
      term: term.term,
      meaning: term.meaning,
      example: term.example,
      createdAt: term.createdAt,
    };
  }

  private toExampleDto(example: CaptionExample): AdminExampleResDto {
    return {
      id: example.id,
      flavor: this.flavorsService.toFlavorDto(example.flavor),
      description: example.description,
      caption: example.caption,
      createdAt: example.createdAt,
    };
  }

  private toDomainDto(row: AllowedDomain): AdminDomainResDto {
    return { id: row.id, domain: row.domain, createdAt: row.createdAt };
  }

  private toEmailDto(row: WhitelistedEmail): AdminEmailResDto {
    return { id: row.id, email: row.email, createdAt: row.createdAt };
  }
}
