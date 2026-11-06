import { FlavorsService } from './flavors.service';
import { HumorFlavor } from './humor-flavor.entity';
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

describe('pickByWeight', () => {
  const service = new FlavorsService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const voice = (id: string, weight: number) => ({ id, weight }) as HumorFlavor;

  it('picks the voices with the fewest captions against their weight', () => {
    const voices = [voice('a', 2), voice('b', 1), voice('c', 1), voice('d', 1)];
    const counts = new Map([
      ['a', 3],
      ['b', 1],
      ['c', 2],
    ]);

    const picked = service.pickByWeight(voices, counts, 2);

    expect(picked.map(({ id }) => id)).toEqual(['d', 'b']);
  });

  it('gives each voice a share of the photos by its weight, as far as the voices per photo allow', () => {
    const voices = [voice('a', 3), voice('b', 1), voice('c', 1), voice('d', 1)];
    const counts = new Map<string, number>();
    for (let photo = 0; photo < 90; photo++) {
      for (const { id } of service.pickByWeight(voices, counts, 3)) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }

    // The first photo's picks are a tie broken at random, so the heaviest voice may miss that one
    expect(counts.get('a')).toBeGreaterThanOrEqual(89);
    for (const id of ['b', 'c', 'd']) {
      expect(counts.get(id)).toBeGreaterThanOrEqual(59);
      expect(counts.get(id)).toBeLessThanOrEqual(61);
    }
  });
});
