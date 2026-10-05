import {
  chooseBatchImages,
  MaxBatchSize,
  MinBatchSize,
} from './batches.service';

describe('chooseBatchImages', () => {
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

  it('fills up to the minimum with images that have no uploader', () => {
    const images = chooseBatchImages(waiting(2, 20));
    expect(images).toHaveLength(MinBatchSize);
    expect(images.map(({ id }) => id).slice(0, 2)).toEqual([
      'upload-0',
      'upload-1',
    ]);
  });

  it('takes every waiting upload up to the maximum', () => {
    expect(chooseBatchImages(waiting(7, 20))).toHaveLength(7);
    expect(chooseBatchImages(waiting(30, 20))).toHaveLength(MaxBatchSize);
  });

  it('takes what waits when less than the minimum waits', () => {
    expect(chooseBatchImages(waiting(1, 2))).toHaveLength(3);
    expect(chooseBatchImages([])).toHaveLength(0);
  });
});
