import { BadRequestException, ConflictException } from '@nestjs/common';
import { RunStatus } from './chain-run.entity';
import { ChainsService } from './chains.service';
import { HumorFlavor } from './humor-flavor.entity';
import { PromptStep, StepInput, StepOutput } from './prompt-step.entity';

const model = { id: 'm1', name: 'gpt', provider: { apiType: 'OpenAI' } };

function step(id: string, position: number, output: StepOutput): PromptStep {
  return {
    id,
    position,
    name: id,
    input: StepInput.Text,
    output,
    systemPrompt: 'S',
    userPrompt: 'U',
    model,
  } as PromptStep;
}

function flavorWith(steps: PromptStep[], inMix: boolean): HumorFlavor {
  return {
    id: 'f1',
    slug: 'deadpan',
    name: 'Deadpan',
    tagline: 'Dry.',
    color: '#64748b',
    position: 0,
    inMix,
    steps,
    createdAt: new Date(),
  } as HumorFlavor;
}

function createService(stubs: {
  flavor: HumorFlavor;
  inMixCount?: number;
  captions?: number;
  update?: jest.Mock;
  runUpdate?: jest.Mock;
  transaction?: jest.Mock;
}): ChainsService {
  return new ChainsService(
    {
      findOne: () => Promise.resolve({ ...stubs.flavor }),
      countBy: () => Promise.resolve(stubs.inMixCount ?? 5),
      update: stubs.update ?? (() => Promise.resolve()),
      delete: () => Promise.resolve(),
    } as never,
    {} as never,
    {
      countBy: () => Promise.resolve(0),
      update: stubs.runUpdate ?? (() => Promise.resolve()),
    } as never,
    { countBy: () => Promise.resolve(stubs.captions ?? 0) } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { transaction: stubs.transaction ?? (() => Promise.resolve()) } as never,
    {} as never,
    {} as never,
  );
}

describe('onModuleInit', () => {
  it('fails every run still running, since the process that ran it is gone', async () => {
    const runUpdate = jest.fn(() => Promise.resolve());
    const service = createService({
      flavor: flavorWith([], false),
      runUpdate,
    });
    await service.onModuleInit();
    expect(runUpdate).toHaveBeenCalledWith(
      { status: RunStatus.Running },
      expect.objectContaining({ status: RunStatus.Failed }),
    );
  });
});

describe('updateChain', () => {
  it('refuses to take a chain into the mix while it does not write captions', async () => {
    const service = createService({
      flavor: flavorWith([step('s1', 0, StepOutput.Text)], false),
    });
    await expect(service.updateChain('f1', { inMix: true })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('refuses to take a voice out when the mix would fall under 3 voices', async () => {
    const service = createService({
      flavor: flavorWith([step('s1', 0, StepOutput.Captions)], true),
      inMixCount: 3,
    });
    await expect(service.updateChain('f1', { inMix: false })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('takes a voice out while 3 others stay', async () => {
    const update = jest.fn(() => Promise.resolve());
    const service = createService({
      flavor: flavorWith([step('s1', 0, StepOutput.Captions)], true),
      inMixCount: 4,
      update,
    });
    await service.updateChain('f1', { inMix: false });
    expect(update).toHaveBeenCalledWith('f1', { inMix: false });
  });
});

describe('reorderSteps', () => {
  const steps = [
    step('s1', 0, StepOutput.Text),
    step('s2', 1, StepOutput.Captions),
  ];

  it('refuses an order that does not name every step once', async () => {
    const service = createService({ flavor: flavorWith(steps, false) });
    await expect(service.reorderSteps('f1', ['s1'])).rejects.toThrow(
      'Give every step of the chain once',
    );
    await expect(service.reorderSteps('f1', ['s1', 's1'])).rejects.toThrow(
      'Give every step of the chain once',
    );
    await expect(service.reorderSteps('f1', ['s1', 'nope'])).rejects.toThrow(
      'Give every step of the chain once',
    );
  });

  it('refuses an order that leaves a chain in the mix ending on text', async () => {
    const service = createService({ flavor: flavorWith(steps, true) });
    await expect(service.reorderSteps('f1', ['s2', 's1'])).rejects.toThrow(
      'A chain in the mix ends with a step that writes captions',
    );
  });

  it('renumbers the steps in the new order for a chain out of the mix', async () => {
    const updates: [string, { position: number }][] = [];
    const transaction = jest.fn((work: (manager: unknown) => Promise<void>) =>
      work({
        update: (
          _entity: unknown,
          id: string,
          change: { position: number },
        ) => {
          updates.push([id, change]);
          return Promise.resolve();
        },
      }),
    );
    const service = createService({
      flavor: flavorWith(steps, false),
      transaction,
    });
    await service.reorderSteps('f1', ['s2', 's1']);
    expect(updates).toEqual([
      ['s2', { position: -1 }],
      ['s1', { position: -2 }],
      ['s2', { position: 0 }],
      ['s1', { position: 1 }],
    ]);
  });
});

describe('removeChain', () => {
  it('refuses a chain in the mix', async () => {
    const service = createService({
      flavor: flavorWith([step('s1', 0, StepOutput.Captions)], true),
    });
    await expect(service.removeChain('f1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('refuses a chain that wrote captions of the product', async () => {
    const service = createService({
      flavor: flavorWith([step('s1', 0, StepOutput.Captions)], false),
      captions: 4,
    });
    await expect(service.removeChain('f1')).rejects.toThrow(ConflictException);
  });
});
