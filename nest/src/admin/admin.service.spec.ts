import { BadRequestException, NotFoundException } from '@nestjs/common';
import { addDays, toCampusDate } from '../common/utils/campus-date';
import { Caption } from '../captions/caption.entity';
import { Image } from '../images/image.entity';
import { AdminService, buildDays, escapeLike } from './admin.service';
import { AdminDayResDto } from './dto/admin.res.dto';

const today = toCampusDate(new Date());

function createService(stubs: {
  imageRepository?: object;
  captionRepository?: object;
  voteRepository?: object;
  itemRepository?: object;
}): AdminService {
  return new AdminService(
    {} as never,
    (stubs.imageRepository ?? {}) as never,
    (stubs.captionRepository ?? {}) as never,
    (stubs.voteRepository ?? {}) as never,
    {} as never,
    {} as never,
    {} as never,
    (stubs.itemRepository ?? {}) as never,
    {} as never,
    {} as never,
  );
}

describe('buildDays', () => {
  it('fills the window oldest first with zeros where no date has a row', () => {
    const rows = new Map<string, Partial<AdminDayResDto>>([
      [today, { picks: 3, voters: 2 }],
      [addDays(today, -2), { uploads: 1 }],
    ]);
    const days = buildDays(today, 3, rows);
    expect(days.map(({ date }) => date)).toEqual([
      addDays(today, -2),
      addDays(today, -1),
      today,
    ]);
    expect(days[0]).toEqual({
      date: addDays(today, -2),
      voters: 0,
      picks: 0,
      uploads: 1,
      captions: 0,
    });
    expect(days[1]).toEqual({
      date: addDays(today, -1),
      voters: 0,
      picks: 0,
      uploads: 0,
      captions: 0,
    });
    expect(days[2]).toEqual({
      date: today,
      voters: 2,
      picks: 3,
      uploads: 0,
      captions: 0,
    });
  });
});

describe('escapeLike', () => {
  it('escapes the ILIKE wildcards and the escape character', () => {
    expect(escapeLike('50%_done\\')).toBe('50\\%\\_done\\\\');
    expect(escapeLike('plain words')).toBe('plain words');
  });
});

describe('updateCaption', () => {
  const caption = {
    id: 'c1',
    content: 'Old text',
    kept: true,
    flavor: { slug: 'deadpan', name: 'Deadpan', tagline: 'Dry.' },
    llmCall: { id: 'call1' },
    createdAt: new Date(),
  } as unknown as Caption;

  it('saves the trimmed content and answers the caption with its votes', async () => {
    const save = jest.fn((value: Caption) => Promise.resolve(value));
    const service = createService({
      captionRepository: { findOne: () => Promise.resolve(caption), save },
      voteRepository: { count: () => Promise.resolve(2) },
    });
    const updated = await service.updateCaption('c1', '  New text  ');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'New text' }),
    );
    expect(updated).toMatchObject({
      id: 'c1',
      content: 'New text',
      kept: true,
      flavor: { slug: 'deadpan' },
      picks: 2,
      downs: 2,
      llmCallId: 'call1',
    });
  });

  it('rejects content that trims to nothing', async () => {
    const service = createService({});
    await expect(service.updateCaption('c1', '   ')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('answers 404 for an unknown caption', async () => {
    const service = createService({
      captionRepository: { findOne: () => Promise.resolve(null) },
    });
    await expect(service.updateCaption('c1', 'New text')).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('findPhoto', () => {
  it('lists the kept captions first, each with its flag', async () => {
    const image = {
      id: 'i1',
      url: 'https://example.test/i1.jpg',
      description: 'A photo',
      place: null,
      uploader: null,
      createdAt: new Date(),
      captions: [
        {
          id: 'c1',
          content: 'Dropped',
          kept: false,
          flavor: null,
          llmCall: null,
          createdAt: new Date(1),
        },
        {
          id: 'c2',
          content: 'Kept',
          kept: true,
          flavor: null,
          llmCall: null,
          createdAt: new Date(2),
        },
      ],
    } as unknown as Image;
    const service = createService({
      imageRepository: { findOne: () => Promise.resolve(image) },
      voteRepository: { find: () => Promise.resolve([]) },
      itemRepository: { find: () => Promise.resolve([]) },
    });
    const photo = await service.findPhoto('i1');
    expect(photo.captions.map(({ id, kept }) => ({ id, kept }))).toEqual([
      { id: 'c2', kept: true },
      { id: 'c1', kept: false },
    ]);
  });
});

describe('removeCaption', () => {
  it('deletes the caption', async () => {
    const service = createService({
      captionRepository: { delete: () => Promise.resolve({ affected: 1 }) },
    });
    await expect(service.removeCaption('c1')).resolves.toBeUndefined();
  });

  it('answers 404 for an unknown caption', async () => {
    const service = createService({
      captionRepository: { delete: () => Promise.resolve({ affected: 0 }) },
    });
    await expect(service.removeCaption('c1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
