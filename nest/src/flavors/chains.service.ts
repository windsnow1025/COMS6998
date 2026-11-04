import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Caption } from '../captions/caption.entity';
import { Image } from '../images/image.entity';
import { LlmCall } from '../llm/llm-call.entity';
import { LlmModel } from '../llm/llm-model.entity';
import { CaptionsPerPhoto } from '../llm/llm.constants';
import { UserResDto } from '../users/dto/user.res.dto';
import { CaptionVote, VoteValue } from '../votes/caption-vote.entity';
import { ChainRunnerService } from './chain-runner.service';
import { ChainRun, RunStatus } from './chain-run.entity';
import { PlaceholderMeanings } from './chain.prompts';
import {
  ChainReqDto,
  ChainUpdateReqDto,
  StepReqDto,
} from './dto/chain.req.dto';
import {
  ChainCaptionPageResDto,
  ChainResDto,
  PlaceholderResDto,
  RunCallResDto,
  RunPageResDto,
  RunPhotoResDto,
  RunResDto,
  RunSummaryResDto,
  StepResDto,
} from './dto/chain.res.dto';
import { ChainOrder, ChainRelations, FlavorsService } from './flavors.service';
import { canWriteCaptions, HumorFlavor } from './humor-flavor.entity';
import { PromptStep, StepOutput } from './prompt-step.entity';

const MixNeedsCaptionsMessage =
  'A chain in the mix ends with a step that writes captions';

// The voices as prompt chains: their steps, the mix, runs of a chain on a photo, and the captions a chain wrote
@Injectable()
export class ChainsService implements OnModuleInit {
  private readonly logger = new Logger(ChainsService.name);

  constructor(
    @InjectRepository(HumorFlavor)
    private readonly flavorRepository: Repository<HumorFlavor>,
    @InjectRepository(PromptStep)
    private readonly stepRepository: Repository<PromptStep>,
    @InjectRepository(ChainRun)
    private readonly runRepository: Repository<ChainRun>,
    @InjectRepository(Caption)
    private readonly captionRepository: Repository<Caption>,
    @InjectRepository(CaptionVote)
    private readonly voteRepository: Repository<CaptionVote>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    @InjectRepository(LlmCall)
    private readonly llmCallRepository: Repository<LlmCall>,
    @InjectRepository(LlmModel)
    private readonly modelRepository: Repository<LlmModel>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly flavorsService: FlavorsService,
    private readonly chainRunner: ChainRunnerService,
  ) {}

  // A run executes in the process that started it, so a run still running when the API stopped never completes
  async onModuleInit() {
    await this.runRepository.update(
      { status: RunStatus.Running },
      {
        status: RunStatus.Failed,
        error: 'The API restarted before the run completed',
        finishedAt: new Date(),
      },
    );
  }

  // Chains

  async findChains(): Promise<ChainResDto[]> {
    const [flavors, captions, runs] = await Promise.all([
      this.flavorsService.findAll(),
      this.countCaptions(),
      this.countRuns(),
    ]);
    return flavors.map((flavor) =>
      this.toChainDto(
        flavor,
        captions.get(flavor.id) ?? 0,
        runs.get(flavor.id) ?? 0,
      ),
    );
  }

  async findChain(id: string): Promise<ChainResDto> {
    return await this.toChainDtoOf(await this.loadChain(id));
  }

  // A new chain starts out of the mix, with no step
  async createChain(dto: ChainReqDto): Promise<ChainResDto> {
    if (await this.flavorRepository.existsBy({ slug: dto.slug })) {
      throw new ConflictException('The slug is taken');
    }
    const row = await this.flavorRepository
      .createQueryBuilder('flavor')
      .select('MAX(flavor.position)', 'max')
      .getRawOne<{ max: number | null }>();
    const saved = await this.flavorRepository.save({
      slug: dto.slug,
      name: dto.name,
      tagline: dto.tagline,
      color: dto.color,
      position: Number(row?.max ?? -1) + 1,
      inMix: false,
    });
    return await this.findChain(saved.id);
  }

  async updateChain(id: string, dto: ChainUpdateReqDto): Promise<ChainResDto> {
    const flavor = await this.loadChain(id);
    const changes: Partial<HumorFlavor> = {};
    if (dto.name !== undefined) {
      changes.name = dto.name;
    }
    if (dto.tagline !== undefined) {
      changes.tagline = dto.tagline;
    }
    if (dto.color !== undefined) {
      changes.color = dto.color;
    }
    if (dto.inMix !== undefined && dto.inMix !== flavor.inMix) {
      await this.checkMixChange(flavor, dto.inMix);
      changes.inMix = dto.inMix;
    }
    if (Object.keys(changes).length > 0) {
      await this.flavorRepository.update(id, changes);
    }
    return await this.findChain(id);
  }

  // For the admin's mix switch, which names the voice by its slug
  async updateMixBySlug(slug: string, inMix: boolean): Promise<ChainResDto> {
    const flavor = await this.flavorRepository.findOneBy({ slug });
    if (!flavor) {
      throw new NotFoundException('Voice not found');
    }
    return await this.updateChain(flavor.id, { inMix });
  }

  // A chain that wrote captions of the product stays, since they reference it; it can leave the mix instead
  async removeChain(id: string): Promise<void> {
    const flavor = await this.loadChain(id);
    if (flavor.inMix) {
      throw new BadRequestException('Take the chain out of the mix first');
    }
    const captions = await this.captionRepository.countBy({ flavor: { id } });
    if (captions > 0) {
      throw new ConflictException(
        `The voice wrote ${captions} ${captions === 1 ? 'caption' : 'captions'} of the product, so it can leave the mix but not be deleted`,
      );
    }
    await this.flavorRepository.delete(id);
  }

  // Steps

  // Appends the step at the chain's end
  async addStep(chainId: string, dto: StepReqDto): Promise<ChainResDto> {
    const flavor = await this.loadChain(chainId);
    const model = await this.findEnabledModel(dto.modelId);
    this.checkWritesCaptions(flavor, [...flavor.steps, { output: dto.output }]);
    await this.stepRepository.save({
      flavor: { id: flavor.id },
      position: flavor.steps.length,
      name: dto.name,
      input: dto.input,
      output: dto.output,
      systemPrompt: dto.systemPrompt,
      userPrompt: dto.userPrompt,
      model,
      temperature: dto.temperature,
    });
    return await this.findChain(chainId);
  }

  async updateStep(
    chainId: string,
    stepId: string,
    dto: StepReqDto,
  ): Promise<ChainResDto> {
    const flavor = await this.loadChain(chainId);
    this.stepOf(flavor, stepId);
    const model = await this.findEnabledModel(dto.modelId);
    this.checkWritesCaptions(
      flavor,
      flavor.steps.map((step) =>
        step.id === stepId ? { output: dto.output } : step,
      ),
    );
    await this.stepRepository.update(stepId, {
      name: dto.name,
      input: dto.input,
      output: dto.output,
      systemPrompt: dto.systemPrompt,
      userPrompt: dto.userPrompt,
      model,
      temperature: dto.temperature,
    });
    return await this.findChain(chainId);
  }

  async removeStep(chainId: string, stepId: string): Promise<ChainResDto> {
    const flavor = await this.loadChain(chainId);
    this.stepOf(flavor, stepId);
    const remaining = flavor.steps.filter((step) => step.id !== stepId);
    this.checkWritesCaptions(flavor, remaining);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(PromptStep, stepId);
      await this.renumber(
        manager,
        remaining.map((step) => step.id),
      );
    });
    return await this.findChain(chainId);
  }

  // `stepIds` are every step of the chain once, in the new order
  async reorderSteps(chainId: string, stepIds: string[]): Promise<ChainResDto> {
    const flavor = await this.loadChain(chainId);
    const ids = new Set(flavor.steps.map((step) => step.id));
    const once =
      stepIds.length === ids.size &&
      new Set(stepIds).size === ids.size &&
      stepIds.every((id) => ids.has(id));
    if (!once) {
      throw new BadRequestException('Give every step of the chain once');
    }
    this.checkWritesCaptions(
      flavor,
      stepIds.map((id) => this.stepOf(flavor, id)),
    );
    await this.dataSource.transaction((manager) =>
      this.renumber(manager, stepIds),
    );
    return await this.findChain(chainId);
  }

  // Runs

  // Starts a run of the chain on the photo; the steps run after the answer, and the run records their outcome
  async createRun(
    chainId: string,
    imageId: string,
    user: UserResDto,
    authorization: string,
  ): Promise<RunResDto> {
    const flavor = await this.loadChain(chainId);
    if (flavor.steps.length === 0) {
      throw new BadRequestException('The chain has no step to run');
    }
    const image = await this.imageRepository.findOneBy({ id: imageId });
    if (!image) {
      throw new NotFoundException('Photo not found');
    }
    const run = await this.runRepository.save({
      flavor: { id: flavor.id },
      image: { id: image.id },
      user: { id: user.id },
      status: RunStatus.Running,
      outputType: flavor.steps[flavor.steps.length - 1].output,
      stepCount: flavor.steps.length,
      output: '',
      error: null,
      finishedAt: null,
    });
    void this.execute(run, flavor, image, user, authorization);
    return await this.findRun(chainId, run.id);
  }

  async findRuns(
    chainId: string,
    limit: number,
    offset: number,
  ): Promise<RunPageResDto> {
    await this.loadChain(chainId);
    const [runs, total] = await this.runRepository.findAndCount({
      where: { flavor: { id: chainId } },
      relations: { image: true, user: true },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
    return { total, runs: runs.map((run) => this.toRunSummaryDto(run)) };
  }

  async findRun(chainId: string, runId: string): Promise<RunResDto> {
    const run = await this.runRepository.findOne({
      where: { id: runId, flavor: { id: chainId } },
      relations: { image: true, user: true },
    });
    if (!run) {
      throw new NotFoundException('Run not found');
    }
    const calls = await this.llmCallRepository.find({
      where: { run: { id: runId } },
      order: { createdAt: 'ASC' },
    });
    return {
      ...this.toRunSummaryDto(run),
      calls: calls.map((call) => this.toCallDto(call)),
    };
  }

  // The captions the chain wrote for the product, newest first, with their picks
  async findCaptions(
    chainId: string,
    limit: number,
    offset: number,
  ): Promise<ChainCaptionPageResDto> {
    await this.loadChain(chainId);
    const [captions, total] = await this.captionRepository.findAndCount({
      where: { flavor: { id: chainId } },
      relations: { image: true },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
    const picks = new Map<string, number>();
    if (captions.length > 0) {
      const rows = await this.voteRepository
        .createQueryBuilder('vote')
        .select('vote."captionId"', 'captionId')
        .addSelect('COUNT(*)', 'picks')
        .where({
          caption: { id: In(captions.map((caption) => caption.id)) },
          value: VoteValue.Up,
        })
        .groupBy('vote."captionId"')
        .getRawMany<{ captionId: string; picks: string }>();
      for (const row of rows) {
        picks.set(row.captionId, Number(row.picks));
      }
    }
    return {
      total,
      captions: captions.map((caption) => ({
        id: caption.id,
        content: caption.content,
        kept: caption.kept,
        picks: picks.get(caption.id) ?? 0,
        photo: this.toPhotoDto(caption.image),
        createdAt: caption.createdAt,
      })),
    };
  }

  findPlaceholders(): PlaceholderResDto[] {
    return Object.entries(PlaceholderMeanings).map(
      ([placeholder, meaning]) => ({ placeholder, meaning }),
    );
  }

  private async execute(
    run: ChainRun,
    flavor: HumorFlavor,
    image: Image,
    user: UserResDto,
    authorization: string,
  ): Promise<void> {
    try {
      const outcome = await this.chainRunner.run(
        flavor,
        {
          id: image.id,
          url: image.url,
          description: image.description,
          place: image.place,
        },
        user,
        authorization,
        run,
      );
      await this.runRepository.update(run.id, {
        status: RunStatus.Succeeded,
        output: outcome.captions
          ? JSON.stringify(outcome.captions)
          : outcome.text,
        finishedAt: new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `The run ${run.id} of the voice "${flavor.slug}" failed: ${message}`,
      );
      await this.runRepository.update(run.id, {
        status: RunStatus.Failed,
        error: message,
        finishedAt: new Date(),
      });
    }
  }

  private async loadChain(id: string): Promise<HumorFlavor> {
    const flavor = await this.flavorRepository.findOne({
      where: { id },
      relations: ChainRelations,
      order: ChainOrder,
    });
    if (!flavor) {
      throw new NotFoundException('Chain not found');
    }
    return flavor;
  }

  // Into the mix needs a chain that writes captions; out of it, the mix keeps at least CaptionsPerPhoto voices
  private async checkMixChange(
    flavor: HumorFlavor,
    inMix: boolean,
  ): Promise<void> {
    if (inMix && !canWriteCaptions(flavor.steps)) {
      throw new BadRequestException(MixNeedsCaptionsMessage);
    }
    if (!inMix) {
      const others = await this.flavorRepository.countBy({ inMix: true });
      if (others - 1 < CaptionsPerPhoto) {
        throw new BadRequestException(
          `The mix keeps at least ${CaptionsPerPhoto} voices`,
        );
      }
    }
  }

  // A change of the steps of a chain in the mix keeps it writing captions
  private checkWritesCaptions(
    flavor: HumorFlavor,
    steps: Pick<PromptStep, 'output'>[],
  ): void {
    if (flavor.inMix && !canWriteCaptions(steps)) {
      throw new BadRequestException(MixNeedsCaptionsMessage);
    }
  }

  // Sets the steps' positions to their order, through negative positions, so that the chain's positions stay
  // unique at every statement
  private async renumber(
    manager: EntityManager,
    stepIds: string[],
  ): Promise<void> {
    for (const [index, id] of stepIds.entries()) {
      await manager.update(PromptStep, id, { position: -(index + 1) });
    }
    for (const [index, id] of stepIds.entries()) {
      await manager.update(PromptStep, id, { position: index });
    }
  }

  private stepOf(flavor: HumorFlavor, stepId: string): PromptStep {
    const step = flavor.steps.find((step) => step.id === stepId);
    if (!step) {
      throw new NotFoundException('Step not found');
    }
    return step;
  }

  private async findEnabledModel(modelId: string): Promise<LlmModel> {
    const model = await this.modelRepository.findOne({
      where: { id: modelId },
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
    return model;
  }

  // Captions written in each voice for the product, by the voice's id
  private async countCaptions(): Promise<Map<string, number>> {
    const rows = await this.captionRepository
      .createQueryBuilder('caption')
      .select('caption."flavorId"', 'id')
      .addSelect('COUNT(*)', 'count')
      .where('caption."flavorId" IS NOT NULL')
      .groupBy('caption."flavorId"')
      .getRawMany<{ id: string; count: string }>();
    return new Map(rows.map((row) => [row.id, Number(row.count)]));
  }

  private async countRuns(): Promise<Map<string, number>> {
    const rows = await this.runRepository
      .createQueryBuilder('run')
      .select('run."flavorId"', 'id')
      .addSelect('COUNT(*)', 'count')
      .groupBy('run."flavorId"')
      .getRawMany<{ id: string; count: string }>();
    return new Map(rows.map((row) => [row.id, Number(row.count)]));
  }

  private async toChainDtoOf(flavor: HumorFlavor): Promise<ChainResDto> {
    const [captions, runs] = await Promise.all([
      this.captionRepository.countBy({ flavor: { id: flavor.id } }),
      this.runRepository.countBy({ flavor: { id: flavor.id } }),
    ]);
    return this.toChainDto(flavor, captions, runs);
  }

  private toChainDto(
    flavor: HumorFlavor,
    captions: number,
    runs: number,
  ): ChainResDto {
    return {
      id: flavor.id,
      slug: flavor.slug,
      name: flavor.name,
      tagline: flavor.tagline,
      color: flavor.color,
      position: flavor.position,
      inMix: flavor.inMix,
      writesCaptions: canWriteCaptions(flavor.steps),
      captions,
      runs,
      steps: flavor.steps.map((step) => this.toStepDto(step)),
      createdAt: flavor.createdAt,
    };
  }

  private toStepDto(step: PromptStep): StepResDto {
    return {
      id: step.id,
      position: step.position,
      name: step.name,
      input: step.input,
      output: step.output,
      systemPrompt: step.systemPrompt,
      userPrompt: step.userPrompt,
      modelId: step.model.id,
      model: step.model.name,
      apiType: step.model.provider.apiType,
      temperature: step.temperature,
    };
  }

  private toRunSummaryDto(run: ChainRun): RunSummaryResDto {
    const succeeded = run.status === RunStatus.Succeeded;
    return {
      id: run.id,
      status: run.status,
      photo: this.toPhotoDto(run.image),
      user: run.user ? { id: run.user.id, username: run.user.username } : null,
      outputType: run.outputType,
      stepCount: run.stepCount,
      captions:
        succeeded && run.outputType === StepOutput.Captions
          ? (JSON.parse(run.output) as string[])
          : null,
      text: succeeded && run.outputType === StepOutput.Text ? run.output : null,
      error: run.error,
      createdAt: run.createdAt,
      finishedAt: run.finishedAt,
    };
  }

  private toCallDto(call: LlmCall): RunCallResDto {
    return {
      id: call.id,
      step: call.step,
      model: call.model,
      temperature: call.temperature,
      systemPrompt: call.systemPrompt,
      userPrompt: call.userPrompt,
      response: call.response,
      inputTokens: call.inputTokens,
      outputTokens: call.outputTokens,
      durationMs: call.durationMs,
      createdAt: call.createdAt,
    };
  }

  private toPhotoDto(image: Image): RunPhotoResDto {
    return {
      id: image.id,
      url: image.url,
      description: image.description,
      place: image.place,
    };
  }
}
