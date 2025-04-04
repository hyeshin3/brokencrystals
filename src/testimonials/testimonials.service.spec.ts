import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { Testimonial } from './api/testimonial.model';
import { TestimonialsService } from './testimonials.service';

describe('TestimonialsService', () => {
  let service: TestimonialsService;
  let entityManagerMock: Partial<EntityManager>;
  let repositoryMock: any;

  beforeEach(async () => {
    entityManagerMock = {
      getConnection: jest.fn().mockReturnValue({
        execute: jest.fn(),
      }),
    };

    repositoryMock = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestimonialsService,
        {
          provide: EntityManager,
          useValue: entityManagerMock,
        },
        {
          provide: getRepositoryToken(Testimonial),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<TestimonialsService>(TestimonialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count', () => {
    it('should return the count of testimonials for a valid query', async () => {
      repositoryMock.count.mockResolvedValue(5);

      const result = await service.count('test');
      expect(result).toBe(5);
      expect(repositoryMock.count).toHaveBeenCalledWith({
        message: { $ilike: '%test%' },
      });
    });

    it('should throw an error for an empty query', async () => {
      await expect(service.count('')).rejects.toThrow('Invalid query parameter');
    });

    it('should sanitize the query and return the count', async () => {
      repositoryMock.count.mockResolvedValue(3);

      const result = await service.count('%test_');
      expect(result).toBe(3);
      expect(repositoryMock.count).toHaveBeenCalledWith({
        message: { $ilike: '%test%' },
      });
    });

    it('should log and throw an error if the database query fails', async () => {
      repositoryMock.count.mockRejectedValue(new Error('Database error'));

      await expect(service.count('test')).rejects.toThrow(
        'Failed to count testimonials',
      );
    });
  });
});
