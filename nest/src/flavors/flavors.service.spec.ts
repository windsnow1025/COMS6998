import { FlavorsService } from './flavors.service';
import { StepInput, StepOutput } from './prompt-step.entity';

interface SavedStep {
  flavor: { id: string };
  position: number;
  name: string;
  input: StepInput;
  output: StepOutput;
  userPrompt: string;
}

describe('onModuleInit', () => {
  it('seeds a looking voice a look step before its caption step and the others the caption step alone', async () => {
    const saved: SavedStep[] = [];
    const flavors = [
      { id: 'f-deadpan', slug: 'deadpan', color: '#64748b', steps: [] },
      { id: 'f-midwest', slug: 'midwest', color: '#2e9e6b', steps: [] },
    ];
    const former = {
      leftJoinAndSelect: () => former,
      where: () => former,
      getOne: () => Promise.resolve(null),
    };
    const service = new FlavorsService(
      {
        findOneBy: ({ slug }: { slug: string }) =>
          Promise.resolve(
            flavors.find((flavor) => flavor.slug === slug) ?? {
              id: slug,
              slug,
              color: '#000000',
            },
          ),
        find: () => Promise.resolve(flavors),
      } as never,
      {
        save: (row: SavedStep) => {
          saved.push(row);
          return Promise.resolve(row);
        },
      } as never,
      {} as never,
      { createQueryBuilder: () => former } as never,
      { ensureModel: () => Promise.resolve({ id: 'm1' }) } as never,
    );

    await service.onModuleInit();

    const stepsOf = (id: string) =>
      saved
        .filter((row) => row.flavor.id === id)
        .map((row) => [row.position, row.name, row.input, row.output]);
    expect(stepsOf('f-deadpan')).toEqual([
      [0, 'caption', StepInput.Text, StepOutput.Captions],
    ]);
    expect(stepsOf('f-midwest')).toEqual([
      [0, 'look', StepInput.Image, StepOutput.Text],
      [1, 'caption', StepInput.Text, StepOutput.Captions],
    ]);
    expect(
      saved.find((row) => row.flavor.id === 'f-midwest' && row.position === 1)
        ?.userPrompt,
    ).toContain('{previous}');
  });
});
