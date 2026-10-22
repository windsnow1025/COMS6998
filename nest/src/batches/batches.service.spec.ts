import {
  chooseBatchImages,
  chooseCover,
  chooseTopUpImages,
  findVotedBatchDate,
  MaxBatchSize,
  MaxCarriedImages,
  MinBatchSize,
} from './batches.service';

describe('findVotedBatchDate', () => {
  const dates = ['2026-10-05', '2026-10-06', '2026-10-08'];

  it('counts a vote for the batch it was cast in, the latest on or before its date', () => {
    expect(findVotedBatchDate(dates, '2026-10-06')).toBe('2026-10-06');
    expect(findVotedBatchDate(dates, '2026-10-07')).toBe('2026-10-06');
    expect(findVotedBatchDate(dates, '2026-10-20')).toBe('2026-10-08');
  });

  it("counts a vote cast before every batch of the photo for the photo's first batch", () => {
    expect(findVotedBatchDate(['2026-10-14'], '2026-10-06')).toBe('2026-10-14');
  });

  it('counts a vote on a photo no batch served for no batch', () => {
    expect(findVotedBatchDate([], '2026-10-06')).toBeNull();
  });
});

describe('chooseCover', () => {
  const images = [{ id: 'carried' }, { id: 'new-1' }, { id: 'new-2' }];
  const firstDates = new Map([
    ['carried', '2026-10-15'],
    ['new-1', '2026-10-22'],
    ['new-2', '2026-10-22'],
  ]);
  const noVotes = new Map<string, string>();

  it('covers a batch the viewer voted in with a photo the viewer voted on in it', () => {
    const votedDates = new Map([
      ['carried', '2026-10-15'],
      ['new-2', '2026-10-22'],
    ]);
    expect(chooseCover(images, firstDates, votedDates, '2026-10-22')?.id).toBe(
      'new-2',
    );
  });

  it('covers a batch with the first photo it brought, past the photos carried over', () => {
    expect(chooseCover(images, firstDates, noVotes, '2026-10-22')?.id).toBe(
      'new-1',
    );
  });

  it('covers a batch that brought no photo with its first one', () => {
    const carriedOnly = new Map(images.map(({ id }) => [id, '2026-10-15']));
    expect(chooseCover(images, carriedOnly, noVotes, '2026-10-22')?.id).toBe(
      'carried',
    );
  });

  it('covers an empty batch with nothing', () => {
    expect(chooseCover([], new Map(), noVotes, '2026-10-22')).toBeUndefined();
  });
});

describe('chooseBatchImages', () => {
  const date = '2026-10-15';
  const carried = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ id: `carried-${index}` }));
  const waiting = (uploads: number, others: number) => [
    ...Array.from({ length: uploads }, (_, index) => ({
      id: `upload-${index}`,
      uploaderId: 1,
    })),
    ...Array.from({ length: others }, (_, index) => ({
      id: `other-${index}`,
      uploaderId: null,
    })),
  ];
  const ids = (images: { id: string }[]) => images.map(({ id }) => id);

  it('leads with the carried photos up to their maximum, then the minimum of new ones', () => {
    const images = chooseBatchImages(carried(7), waiting(0, 20), date);
    expect(images).toHaveLength(MaxCarriedImages + MinBatchSize);
    expect(ids(images).slice(0, MaxCarriedImages)).toEqual(
      ids(carried(MaxCarriedImages)),
    );
    expect(ids(images).slice(MaxCarriedImages)).toEqual(
      ids(chooseBatchImages([], waiting(0, 20), date)),
    );
  });

  it('fills up to the minimum with images that have no uploader', () => {
    const images = chooseBatchImages([], waiting(2, 20), date);
    expect(images).toHaveLength(MinBatchSize);
    expect(ids(images).slice(0, 2)).toEqual(['upload-0', 'upload-1']);
    expect(
      ids(images)
        .slice(2)
        .every((id) => id.startsWith('other-')),
    ).toBe(true);
  });

  it('takes every waiting upload up to the room the carried photos leave', () => {
    expect(chooseBatchImages([], waiting(7, 20), date)).toHaveLength(7);
    expect(chooseBatchImages([], waiting(30, 20), date)).toHaveLength(
      MaxBatchSize,
    );
    expect(ids(chooseBatchImages(carried(5), waiting(7, 20), date))).toEqual([
      ...ids(carried(5)),
      'upload-0',
      'upload-1',
      'upload-2',
      'upload-3',
      'upload-4',
    ]);
  });

  it('takes what there is when less than the minimum waits', () => {
    expect(chooseBatchImages([], waiting(1, 2), date)).toHaveLength(3);
    expect(chooseBatchImages(carried(2), [], date)).toHaveLength(2);
    expect(chooseBatchImages([], [], date)).toHaveLength(0);
  });

  it('draws the images without an uploader by the date', () => {
    const drawn = chooseBatchImages([], waiting(0, 20), date);
    expect(chooseBatchImages([], waiting(0, 20), date)).toEqual(drawn);
    expect(chooseBatchImages([], waiting(0, 20).reverse(), date)).toEqual(
      drawn,
    );
    expect(chooseBatchImages([], waiting(0, 20), '2026-10-16')).not.toEqual(
      drawn,
    );
  });
});

describe('chooseTopUpImages', () => {
  const date = '2026-10-15';
  const waiting = (uploads: number, others: number) => [
    ...Array.from({ length: uploads }, (_, index) => ({
      id: `upload-${index}`,
      uploaderId: 1,
    })),
    ...Array.from({ length: others }, (_, index) => ({
      id: `other-${index}`,
      uploaderId: null,
    })),
  ];
  const ids = (images: { id: string }[]) => images.map(({ id }) => id);

  it('takes the waiting uploads in their order, then the draw, as far as the room goes', () => {
    const images = chooseTopUpImages(waiting(2, 20), date, 4);
    expect(images).toHaveLength(4);
    expect(ids(images).slice(0, 2)).toEqual(['upload-0', 'upload-1']);
    expect(
      ids(images)
        .slice(2)
        .every((id) => id.startsWith('other-')),
    ).toBe(true);
    expect(chooseTopUpImages(waiting(0, 2), date, 5)).toHaveLength(2);
  });

  it('draws the images without an uploader by the date', () => {
    const drawn = chooseTopUpImages(waiting(0, 20), date, 5);
    expect(chooseTopUpImages(waiting(0, 20).reverse(), date, 5)).toEqual(drawn);
    expect(ids(drawn)).toEqual(
      ids(chooseBatchImages([], waiting(0, 20), date)),
    );
    expect(chooseTopUpImages(waiting(0, 20), '2026-10-16', 5)).not.toEqual(
      drawn,
    );
  });
});
