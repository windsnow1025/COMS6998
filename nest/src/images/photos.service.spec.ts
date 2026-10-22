import {
  addDays,
  startOfCampusDate,
  toCampusDate,
} from '../common/utils/campus-date';
import { PhotoTally } from '../votes/votes.service';
import { Image } from './image.entity';
import { PhotosService } from './photos.service';

const today = toCampusDate(new Date());
const yesterday = addDays(today, -1);
const twoDaysAgo = addDays(today, -2);
const flavor = { slug: 'deadpan', name: 'Deadpan', tagline: 'Dry.' };

// `keptIds` are the captions the photo keeps; all of them unless given
function image(id: string, captionIds: string[], keptIds = captionIds): Image {
  return {
    id,
    url: `https://example.test/${id}.jpg`,
    description: id,
    place: null,
    storageKey: null,
    uploader: null,
    captions: captionIds.map((captionId) => ({
      id: captionId,
      content: captionId,
      flavor,
      kept: keptIds.includes(captionId),
    })),
    createdAt: new Date(),
  } as unknown as Image;
}

function tally(picks: Record<string, number>, voters: number): PhotoTally {
  return { picks: new Map(Object.entries(picks)), voters, nonePicks: 0 };
}

interface Fixture {
  // Each image with the date of a batch that served it; an image carried over appears once per batch
  served: { image: Image; date: string }[];
  tallies: Map<string, PhotoTally>;
  picks: Map<string, string | null>;
  // When the viewer first voted on each photo
  voteDates?: Map<string, Date>;
}

function createService(fixture: Fixture): PhotosService {
  const items = fixture.served.map(({ image, date }) => ({
    image,
    batch: { date },
  }));
  return new PhotosService(
    {} as never,
    { find: () => Promise.resolve(items) } as never,
    {
      getTallies: () => Promise.resolve(fixture.tallies),
      getPicks: () => Promise.resolve(fixture.picks),
      getVoteDates: () => Promise.resolve(fixture.voteDates ?? new Map()),
    } as never,
    { toFlavorDto: (value: typeof flavor) => value } as never,
  );
}

describe('PhotosService', () => {
  const photo = image('photo', ['a', 'b', 'c']);
  const tallies = new Map([['photo', tally({ a: 2, b: 1 }, 3)]]);

  describe('toPhotoDtos', () => {
    it('hides the results of an open batch from a viewer who has not voted', async () => {
      const service = createService({
        served: [{ image: photo, date: today }],
        tallies,
        picks: new Map(),
      });
      const [dto] = await service.toPhotoDtos([photo], 2);
      expect(dto.revealed).toBe(false);
      expect(dto.voters).toBeUndefined();
      expect(dto.captions[0].flavor).toBeUndefined();
    });

    it('reveals the results of an open batch to a viewer who has voted', async () => {
      const service = createService({
        served: [{ image: photo, date: today }],
        tallies,
        picks: new Map([['photo', 'a']]),
      });
      const [dto] = await service.toPhotoDtos([photo], 2);
      expect(dto.revealed).toBe(true);
      expect(dto.viewer).toEqual({
        isOwner: false,
        hasVoted: true,
        captionId: 'a',
        matched: true,
      });
    });

    it('reveals the results of a closed batch to every viewer', async () => {
      const service = createService({
        served: [{ image: photo, date: yesterday }],
        tallies,
        picks: new Map(),
      });
      for (const viewerId of [2, undefined]) {
        const [dto] = await service.toPhotoDtos([photo], viewerId);
        expect(dto.revealed).toBe(true);
        expect(dto.voters).toBe(3);
        expect(dto.captions.map(({ picks }) => picks)).toEqual([2, 1, 0]);
        expect(dto.captions[0].flavor).toEqual(flavor);
        expect(dto.viewer.hasVoted).toBe(false);
      }
    });

    it('hides the results of an open batch from an anonymous viewer', async () => {
      const service = createService({
        served: [{ image: photo, date: today }],
        tallies,
        picks: new Map(),
      });
      const [dto] = await service.toPhotoDtos([photo], undefined);
      expect(dto.revealed).toBe(false);
    });

    it('dates a photo by its latest batch, which keeps it open while a batch of today serves it again', async () => {
      const service = createService({
        served: [
          { image: photo, date: yesterday },
          { image: photo, date: today },
        ],
        tallies,
        picks: new Map(),
      });
      const [dto] = await service.toPhotoDtos([photo], 2);
      expect(dto.batchDate).toBe(today);
      expect(dto.revealed).toBe(false);
    });

    it('shows the kept captions to every viewer and the drafts to the uploader until a batch serves the photo', async () => {
      const drafted = {
        ...image('drafted', ['a', 'b', 'c', 'd', 'e'], ['b', 'c', 'e']),
        uploader: { id: 1 },
      } as unknown as Image;
      const waiting = createService({ served: [], tallies, picks: new Map() });
      jest.spyOn(waiting, 'findWaiting').mockResolvedValue([]);

      const [own] = await waiting.toPhotoDtos([drafted], 1);
      expect(own.captions.map(({ id }) => id)).toEqual(['b', 'c', 'e']);
      expect(own.drafts?.map(({ id, kept }) => [id, kept])).toEqual([
        ['a', false],
        ['b', true],
        ['c', true],
        ['d', false],
        ['e', true],
      ]);

      const [other] = await waiting.toPhotoDtos([drafted], 2);
      expect(other.captions.map(({ id }) => id)).toEqual(['b', 'c', 'e']);
      expect(other.drafts).toBeUndefined();

      const served = createService({
        served: [{ image: drafted, date: today }],
        tallies,
        picks: new Map(),
      });
      const [locked] = await served.toPhotoDtos([drafted], 1);
      expect(locked.drafts).toBeUndefined();
    });
  });

  describe('findTop', () => {
    it('lists the photos with a verdict, the most picked first', async () => {
      const most = image('most', ['a', 'b']);
      const lead = image('lead', ['c', 'd']);
      const none = image('none', ['e', 'f']);
      const one = image('one', ['g', 'h']);
      const tied = image('tied', ['i', 'j']);
      const service = createService({
        served: [most, lead, none, one, tied].map((value) => ({
          image: value,
          date: yesterday,
        })),
        tallies: new Map([
          ['most', tally({ a: 3 }, 3)],
          ['lead', tally({ c: 2, d: 1 }, 3)],
          ['none', tally({}, 2)],
          ['one', tally({ g: 1 }, 1)],
          ['tied', tally({ i: 2, j: 2 }, 4)],
        ]),
        picks: new Map(),
      });
      const top = await service.findTop(null);
      expect(top.map(({ id }) => id)).toEqual(['most', 'lead']);
    });

    it('lists a photo once, by its latest batch, and not while a batch of today serves it', async () => {
      const twice = image('twice', ['a', 'b']);
      const carried = image('carried', ['c', 'd']);
      const service = createService({
        served: [
          { image: twice, date: twoDaysAgo },
          { image: twice, date: yesterday },
          { image: carried, date: yesterday },
          { image: carried, date: today },
        ],
        tallies: new Map([
          ['twice', tally({ a: 2 }, 2)],
          ['carried', tally({ c: 2 }, 2)],
        ]),
        picks: new Map(),
      });
      expect((await service.findTop(null)).map(({ id }) => id)).toEqual([
        'twice',
      ]);
      expect((await service.findTop(yesterday)).map(({ id }) => id)).toEqual([
        'twice',
      ]);
      expect(await service.findTop(today)).toEqual([]);
    });
  });

  describe('findCarryOver', () => {
    it('carries the photos of earlier batches without a verdict, the most voted first, then the earliest served', async () => {
      const service = createService({
        served: [
          { image: image('later', ['a']), date: yesterday },
          { image: image('earlier', ['b']), date: twoDaysAgo },
          { image: image('decided', ['c']), date: yesterday },
          { image: image('tied', ['g', 'h']), date: yesterday },
          { image: image('unvoted', ['d']), date: yesterday },
          { image: image('serving', ['e']), date: today },
          { image: image('carried', ['f']), date: yesterday },
          { image: image('carried', ['f']), date: today },
        ],
        tallies: new Map([
          ['later', tally({ a: 1 }, 1)],
          ['earlier', tally({ b: 1 }, 1)],
          ['decided', tally({ c: 2 }, 2)],
          ['tied', tally({ g: 1, h: 1 }, 2)],
          ['carried', tally({ f: 1 }, 1)],
        ]),
        picks: new Map(),
      });
      const carried = await service.findCarryOver(today);
      expect(carried.map(({ id }) => id)).toEqual([
        'tied',
        'earlier',
        'later',
        'unvoted',
      ]);
      expect(carried[1]).toEqual({
        id: 'earlier',
        voters: 1,
        firstDate: twoDaysAgo,
      });
    });
  });

  describe('findJudgedBefore', () => {
    it('names the photos the viewer voted on before the date and the carried photos the viewer uploaded', async () => {
      const votedEarlier = image('votedEarlier', ['a']);
      const votedToday = image('votedToday', ['b']);
      const fresh = image('fresh', ['c']);
      const own = { ...image('own', ['d']), uploader: { id: 2 } } as Image;
      const service = createService({
        served: [
          { image: votedEarlier, date: twoDaysAgo },
          { image: votedEarlier, date: today },
          { image: votedToday, date: yesterday },
          { image: votedToday, date: today },
          { image: fresh, date: today },
          { image: own, date: twoDaysAgo },
          { image: own, date: today },
        ],
        tallies: new Map(),
        picks: new Map(),
        voteDates: new Map([
          ['votedEarlier', startOfCampusDate(yesterday)],
          ['votedToday', new Date()],
        ]),
      });
      const images = [votedEarlier, votedToday, fresh, own];
      const judged = await service.findJudgedBefore(images, 2, today);
      expect([...judged].sort()).toEqual(['own', 'votedEarlier']);
      expect(await service.findJudgedBefore(images, undefined, today)).toEqual(
        new Set(),
      );
    });
  });

  describe('isClosed', () => {
    it('is true once the batch date has passed, and false before or without a batch', async () => {
      const service = createService({
        served: [
          { image: image('old', ['a']), date: yesterday },
          { image: image('new', ['b']), date: today },
        ],
        tallies: new Map(),
        picks: new Map(),
      });
      expect(await service.isClosed('old')).toBe(true);
      expect(await service.isClosed('new')).toBe(false);
      expect(await service.isClosed('waiting')).toBe(false);
    });

    it('is false for a photo that a batch of today serves again', async () => {
      const service = createService({
        served: [
          { image: image('again', ['a']), date: yesterday },
          { image: image('again', ['a']), date: today },
        ],
        tallies: new Map(),
        picks: new Map(),
      });
      expect(await service.isClosed('again')).toBe(false);
    });
  });
});
