import { DailyBatch } from '../batches/daily-batch.entity';
import {
  addDays,
  startOfCampusDate,
  toCampusDate,
} from '../common/utils/campus-date';
import { UserResDto } from '../users/dto/user.res.dto';
import { CaptionVote, VoteValue } from '../votes/caption-vote.entity';
import { StatsService } from './stats.service';

const today = toCampusDate(new Date());
const yesterday = addDays(today, -1);
const twoDaysAgo = addDays(today, -2);
const user = { id: 2 } as UserResDto;

function batch(
  date: string,
  items: { imageId: string; lateAddition?: boolean }[],
): DailyBatch {
  return {
    date,
    items: items.map(({ imageId, lateAddition }, position) => ({
      image: { id: imageId, uploader: null },
      lateAddition: lateAddition ?? false,
      position,
    })),
  } as unknown as DailyBatch;
}

function vote(imageId: string, date: string): CaptionVote {
  return {
    image: { id: imageId },
    caption: { id: `${imageId}-caption` },
    value: VoteValue.Up,
    createdAt: startOfCampusDate(date),
  } as unknown as CaptionVote;
}

function createService(
  batches: DailyBatch[],
  votes: CaptionVote[],
): StatsService {
  return new StatsService(
    { find: () => Promise.resolve(batches) } as never,
    {
      find: () => Promise.resolve([]),
      count: () => Promise.resolve(0),
    } as never,
    {
      findByUser: () => Promise.resolve(votes),
      getTallies: () => Promise.resolve(new Map()),
      countPicksReceived: () => Promise.resolve(0),
    } as never,
    { findAll: () => Promise.resolve([]) } as never,
    { getRoastsLeft: () => Promise.resolve(0) } as never,
  );
}

describe('StatsService', () => {
  describe('the streak of findByUser', () => {
    it('passes over a date whose batch held only photos the user judged earlier', async () => {
      const batches = [
        batch(today, [{ imageId: 'p' }]),
        batch(yesterday, [{ imageId: 'p' }]),
        batch(twoDaysAgo, [{ imageId: 'p' }]),
      ];
      const service = createService(batches, [vote('p', twoDaysAgo)]);
      expect((await service.findByUser(user)).streak).toBe(1);
    });

    it('asks no vote on a photo added late to the batch', async () => {
      const batches = [
        batch(today, [
          { imageId: 'q' },
          { imageId: 'late', lateAddition: true },
        ]),
      ];
      const service = createService(batches, [vote('q', today)]);
      expect((await service.findByUser(user)).streak).toBe(1);
    });

    it('breaks the run at a date with unvoted photos', async () => {
      const batches = [
        batch(yesterday, [{ imageId: 'b' }]),
        batch(twoDaysAgo, [{ imageId: 'a' }]),
      ];
      const service = createService(batches, [vote('a', twoDaysAgo)]);
      expect((await service.findByUser(user)).streak).toBe(0);
    });
  });
});
