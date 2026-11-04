import { HumorFlavor } from '../flavors/humor-flavor.entity';
import { ImagesService } from './images.service';

const user = { id: 1, roles: [] } as never;
const voices = ['deadpan', 'online', 'midwest'].map(
  (slug) => ({ id: slug, slug }) as HumorFlavor,
);

const Scenery = 'The cart took the scenic route and became scenery.';
const SceneryAgain =
  'the shopping cart took the scenic route and became scenery';
const Fine = 'Oh, I am sure the cart is fine.';
const Feral = 'the cart has entered its feral era';

// A service whose photo has no caption yet, with the chains' answers given in the order the chains are run
function createService(run: jest.Mock, runApart: jest.Mock, saved: object[]) {
  const image = { id: 'i1', url: 'u', description: 'D', place: null };
  return new ImagesService(
    {
      findOne: () =>
        Promise.resolve({ ...image, uploader: { id: 1 }, captions: [] }),
    } as never,
    {
      transaction: (work: (manager: object) => Promise<void>) =>
        work({
          save: (_: unknown, rows: object[]) => {
            saved.push(...rows);
            return Promise.resolve(rows);
          },
        }),
    } as never,
    {} as never,
    {} as never,
    {} as never,
    { findWriters: () => Promise.resolve(voices) } as never,
    { run, runApart } as never,
    {} as never,
    { relations: {} } as never,
  );
}

function outcome(text: string, callId: string) {
  return { calls: [{ id: callId }], text, captions: [text] };
}

describe('ImagesService.writeDrafts', () => {
  it('has the voice whose caption tells the joke of an earlier one write apart from the others', async () => {
    const run = jest
      .fn()
      .mockResolvedValueOnce(outcome(Scenery, 'c1'))
      .mockResolvedValueOnce(outcome(SceneryAgain, 'c2'))
      .mockResolvedValueOnce(outcome(Fine, 'c3'));
    const runApart = jest.fn().mockResolvedValue(outcome(Feral, 'c4'));
    const saved: object[] = [];

    await createService(run, runApart, saved).writeDrafts(
      user,
      'i1',
      'Bearer t',
    );

    expect(run).toHaveBeenCalledTimes(3);
    expect(runApart).toHaveBeenCalledTimes(1);
    const rewrite = runApart.mock.calls[0] as unknown[];
    expect(rewrite[0]).toBe(voices[1]);
    expect(rewrite[5]).toEqual([Scenery, Fine]);
    expect(rewrite[6]).toEqual(outcome(SceneryAgain, 'c2'));
    expect(saved).toMatchObject([
      { content: Scenery, llmCall: { id: 'c1' } },
      { content: Feral, llmCall: { id: 'c4' } },
      { content: Fine, llmCall: { id: 'c3' } },
    ]);
  });

  it('runs each voice once when no caption repeats another', async () => {
    const run = jest
      .fn()
      .mockResolvedValueOnce(outcome(Scenery, 'c1'))
      .mockResolvedValueOnce(outcome(Feral, 'c2'))
      .mockResolvedValueOnce(outcome(Fine, 'c3'));
    const runApart = jest.fn();

    await createService(run, runApart, []).writeDrafts(user, 'i1', 'Bearer t');

    expect(run).toHaveBeenCalledTimes(3);
    expect(runApart).not.toHaveBeenCalled();
  });
});
