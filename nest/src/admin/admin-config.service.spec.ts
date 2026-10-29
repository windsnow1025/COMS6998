import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HumorFlavor } from '../flavors/humor-flavor.entity';
import { AdminConfigService, toExcerpt } from './admin-config.service';

function createService(stubs: {
  flavorRepository?: object;
  flavorsService?: object;
}): AdminConfigService {
  return new AdminConfigService(
    (stubs.flavorRepository ?? {}) as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { find: () => Promise.resolve([]) } as never,
    {} as never,
    (stubs.flavorsService ?? {}) as never,
    {} as never,
    {} as never,
  );
}

describe('toExcerpt', () => {
  it('collapses whitespace and cuts a long response with an ellipsis', () => {
    expect(toExcerpt('a\n  b\t c')).toBe('a b c');
    const long = 'x'.repeat(200);
    expect(toExcerpt(long)).toBe(`${'x'.repeat(160)}…`);
  });
});

describe('updateChain', () => {
  const flavor = { id: 'f1', slug: 'deadpan', inMix: true } as HumorFlavor;

  it('refuses to take a voice out when the mix would fall under 3 voices', async () => {
    const service = createService({
      flavorRepository: {
        findOneBy: () => Promise.resolve({ ...flavor }),
        countBy: () => Promise.resolve(3),
      },
    });
    await expect(service.updateChain('deadpan', false)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('takes a voice out while 3 others stay', async () => {
    const save = jest.fn((value: HumorFlavor) => Promise.resolve(value));
    const service = createService({
      flavorRepository: {
        findOneBy: () => Promise.resolve({ ...flavor }),
        countBy: () => Promise.resolve(4),
        save,
      },
      flavorsService: {
        findAll: () => Promise.resolve([{ ...flavor, inMix: false }]),
        countCaptions: () => Promise.resolve(new Map()),
        findInMix: () => Promise.resolve([]),
        findPromptMaterial: () => Promise.resolve({ terms: [], examples: [] }),
      },
    });
    const chain = await service.updateChain('deadpan', false);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ inMix: false }),
    );
    expect(chain).toMatchObject({ slug: 'deadpan', inMix: false });
  });

  it('answers 404 for an unknown voice', async () => {
    const service = createService({
      flavorRepository: { findOneBy: () => Promise.resolve(null) },
    });
    await expect(service.updateChain('nope', true)).rejects.toThrow(
      NotFoundException,
    );
  });
});
