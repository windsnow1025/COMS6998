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
import { ChainsService } from '../flavors/chains.service';
import { ChainResDto } from '../flavors/dto/chain.res.dto';
import { FlavorsService } from '../flavors/flavors.service';
import { HumorFlavor } from '../flavors/humor-flavor.entity';
import { PromptStep } from '../flavors/prompt-step.entity';
import { Term } from '../flavors/term.entity';
import { LlmCall, LlmStep } from '../llm/llm-call.entity';
import { AvailableModel, LlmClient } from '../llm/llm.client';
import { LlmModel } from '../llm/llm-model.entity';
import { LlmProvider } from '../llm/llm-provider.entity';
import { PipelineStep } from '../llm/pipeline-step.entity';
import {
  buildDescribeUserPrompt,
  DescribeSystemPrompt,
} from '../llm/roast.prompts';
import {
  AdminModelReqDto,
  AdminModelUpdateReqDto,
  AdminProviderReqDto,
  AdminProviderUpdateReqDto,
  AdminScreeningReqDto,
  AdminTermReqDto,
} from './dto/admin-config.req.dto';
import {
  AdminAccessPolicyResDto,
  AdminAvailableModelResDto,
  AdminDomainResDto,
  AdminEmailResDto,
  AdminExampleResDto,
  AdminLlmCallPageResDto,
  AdminLlmCallSummaryResDto,
  AdminModelResDto,
  AdminModelStepResDto,
  AdminProviderResDto,
  AdminScreeningResDto,
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

// The admin's view of the generation and what feeds it: the voices as chains and their mix (ChainsService), the screening
// with its model, the providers and the models, the terms and the caption examples, the LLM calls, and who may sign up
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
    @InjectRepository(PromptStep)
    private readonly promptStepRepository: Repository<PromptStep>,
    private readonly flavorsService: FlavorsService,
    private readonly chainsService: ChainsService,
    private readonly accessService: AccessService,
    private readonly llmClient: LlmClient,
  ) {}

  // Chains: the voices, each with its steps (ChainsService)

  async findChains(): Promise<ChainResDto[]> {
    return await this.chainsService.findChains();
  }

  // Takes a voice into the mix or out of it
  async updateChain(slug: string, inMix: boolean): Promise<ChainResDto> {
    return await this.chainsService.updateMixBySlug(slug, inMix);
  }

  // The screening: the product's own step before any chain, with the prompts it runs

  async findScreening(): Promise<AdminScreeningResDto> {
    return this.toScreeningDto(await this.findScreeningRow());
  }

  async updateScreening(
    dto: AdminScreeningReqDto,
  ): Promise<AdminScreeningResDto> {
    const row = await this.findScreeningRow();
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
    return this.toScreeningDto(await this.stepRepository.save(row));
  }

  // Providers and models

  async findAvailableModels(): Promise<AdminAvailableModelResDto[]> {
    return await this.llmClient.listModels();
  }

  async findProviders(): Promise<AdminProviderResDto[]> {
    const providers = await this.providerRepository.find({
      relations: { models: true },
      order: { apiType: 'ASC' },
    });
    return providers.map((provider) => this.toProviderDto(provider));
  }

  async createProvider(dto: AdminProviderReqDto): Promise<AdminProviderResDto> {
    const apiType = dto.apiType.trim();
    await this.checkAvailable(apiType);
    const provider = this.providerRepository.create({
      apiType,
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
    if (dto.apiType !== undefined) {
      provider.apiType = dto.apiType.trim();
      await this.checkAvailable(provider.apiType);
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
        throw new ConflictException('A step runs on a model of this provider');
      }
      throw error;
    }
  }

  async findModels(): Promise<AdminModelResDto[]> {
    const [models, screening, chainSteps] = await Promise.all([
      this.modelRepository.find({
        relations: { provider: true },
        order: { provider: { apiType: 'ASC' }, name: 'ASC' },
      }),
      this.findScreeningRow(),
      this.findChainSteps(),
    ]);
    return models.map((model) => this.toModelDto(model, screening, chainSteps));
  }

  async createModel(dto: AdminModelReqDto): Promise<AdminModelResDto> {
    const provider = await this.providerRepository.findOneBy({
      id: dto.providerId,
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    const name = dto.name.trim();
    await this.checkAvailable(provider.apiType, name);
    const model = this.modelRepository.create({
      provider,
      name,
      enabled: dto.enabled ?? true,
    });
    return this.toModelDto(await this.saveModel(model), null, []);
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
      await this.checkAvailable(model.provider.apiType, model.name);
    }
    if (dto.enabled !== undefined) {
      model.enabled = dto.enabled;
    }
    const saved = await this.saveModel(model);
    return this.toModelDto(
      saved,
      await this.findScreeningRow(),
      await this.findChainSteps(),
    );
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
        throw new ConflictException('A step runs on this model');
      }
      throw error;
    }
  }

  // Terms

  async findTerms(): Promise<AdminTermResDto[]> {
    const terms = await this.termRepository.find({ order: { term: 'ASC' } });
    return terms.map((term) => this.toTermDto(term));
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
    const examples = await this.exampleRepository.find({
      relations: { flavor: true },
      order: { createdAt: 'ASC' },
    });
    return examples.map((example) => this.toExampleDto(example));
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

  // The steps requests were made for, in the order the filter lists them: the screening, the chains' steps in the
  // chains' order, then the steps of no chain any more, by name
  async findLlmCallSteps(): Promise<string[]> {
    const [rows, chainSteps] = await Promise.all([
      this.llmCallRepository
        .createQueryBuilder('call')
        .select('DISTINCT call.step', 'step')
        .getRawMany<{ step: string }>(),
      this.findChainSteps(),
    ]);
    const used = new Set(rows.map((row) => row.step));
    const ordered: string[] = [];
    for (const name of [
      LlmStep.Describe as string,
      ...chainSteps.map((step) => step.name),
      ...[...used].sort(),
    ]) {
      if (used.has(name) && !ordered.includes(name)) {
        ordered.push(name);
      }
    }
    return ordered;
  }

  async findLlmCalls(
    offset: number,
    limit: number,
    step: string | undefined,
    q: string | undefined,
  ): Promise<AdminLlmCallPageResDto> {
    const query = this.llmCallRepository
      .createQueryBuilder('call')
      .leftJoinAndSelect('call.image', 'image')
      .leftJoinAndSelect('call.user', 'user')
      .leftJoinAndSelect('call.flavor', 'flavor')
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
        flavor: call.flavor
          ? this.flavorsService.toFlavorDto(call.flavor)
          : null,
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

  async findAccessPolicy(): Promise<AdminAccessPolicyResDto> {
    const policy = await this.accessService.findPolicy();
    return { restricted: policy.restricted };
  }

  async updateAccessPolicy(
    restricted: boolean,
  ): Promise<AdminAccessPolicyResDto> {
    const policy = await this.accessService.updatePolicy(restricted);
    return { restricted: policy.restricted };
  }

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

  // Refuses an API type FastAPI's model list lacks, or a model it lacks for the API type
  private async checkAvailable(apiType: string, model?: string): Promise<void> {
    const available: AvailableModel[] = await this.llmClient.listModels();
    if (!available.some((row) => row.apiType === apiType)) {
      throw new BadRequestException(
        `No provider of the API type "${apiType}" can be called`,
      );
    }
    if (
      model !== undefined &&
      !available.some((row) => row.apiType === apiType && row.model === model)
    ) {
      throw new BadRequestException(
        `No model "${model}" of "${apiType}" can be called`,
      );
    }
  }

  // The screening's row, which PipelineService seeds at the start
  private async findScreeningRow(): Promise<PipelineStep> {
    const row = await this.stepRepository.findOne({
      where: { step: LlmStep.Describe },
      relations: { model: { provider: true } },
    });
    if (!row) {
      throw new Error('The screening is not configured');
    }
    return row;
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
        throw new ConflictException('A provider of this API type exists');
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

  // The screening's prompts are the code's, the uploader's note standing as a placeholder
  private toScreeningDto(row: PipelineStep): AdminScreeningResDto {
    return {
      step: row.step,
      modelId: row.model.id,
      model: row.model.name,
      apiType: row.model.provider.apiType,
      temperature: row.temperature,
      systemPrompt: DescribeSystemPrompt,
      userPrompt: buildDescribeUserPrompt('{place}'),
    };
  }

  private toProviderDto(provider: LlmProvider): AdminProviderResDto {
    return {
      id: provider.id,
      apiType: provider.apiType,
      enabled: provider.enabled,
      models: provider.models.length,
    };
  }

  // Every chain's steps with their voices, in the voices' order
  private async findChainSteps(): Promise<PromptStep[]> {
    return await this.promptStepRepository.find({
      relations: { flavor: true, model: true },
      order: { flavor: { position: 'ASC' }, position: 'ASC' },
    });
  }

  private toModelDto(
    model: LlmModel,
    screening: PipelineStep | null,
    chainSteps: PromptStep[],
  ): AdminModelResDto {
    const steps: AdminModelStepResDto[] = [];
    if (screening && screening.model.id === model.id) {
      steps.push({ flavor: null, step: screening.step });
    }
    for (const step of chainSteps) {
      if (step.model.id === model.id) {
        steps.push({
          flavor: this.flavorsService.toFlavorDto(step.flavor),
          step: step.name,
        });
      }
    }
    return {
      id: model.id,
      providerId: model.provider.id,
      apiType: model.provider.apiType,
      name: model.name,
      enabled: model.enabled,
      providerEnabled: model.provider.enabled,
      steps,
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
