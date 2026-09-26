import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caption } from './caption.entity';
import { CaptionsService } from './captions.service';

describe('CaptionsService', () => {
  let service: CaptionsService;
  let repository: jest.Mocked<Pick<Repository<Caption>, 'find'>>;

  beforeEach(async () => {
    repository = { find: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        CaptionsService,
        { provide: getRepositoryToken(Caption), useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(CaptionsService);
  });

  it('finds captions with their images, newest first', async () => {
    repository.find.mockResolvedValue([]);
    await service.findAll();
    expect(repository.find).toHaveBeenCalledWith({
      relations: { image: true },
      order: { createdAt: 'DESC' },
    });
  });

  it('maps a caption and its image to the response DTO', () => {
    const createdAt = new Date('2026-09-23T00:00:00Z');
    const caption = {
      id: '6b1a6f2e-3d0c-4b9e-9f1d-2a7c5e8b4d10',
      content: 'me opening Gradescope at 2 a.m.',
      createdAt,
      image: {
        id: '0f9d3c2b-7a1e-4c6d-8b2f-5e4a9c1d7b33',
        url: 'https://example.com/7.jpg',
        description: 'a dog',
      },
    } as Caption;
    expect(service.toCaptionDto(caption)).toEqual({
      id: '6b1a6f2e-3d0c-4b9e-9f1d-2a7c5e8b4d10',
      content: 'me opening Gradescope at 2 a.m.',
      image: {
        id: '0f9d3c2b-7a1e-4c6d-8b2f-5e4a9c1d7b33',
        url: 'https://example.com/7.jpg',
        description: 'a dog',
      },
      createdAt,
    });
  });
});
