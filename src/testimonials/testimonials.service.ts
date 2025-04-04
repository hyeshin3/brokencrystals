import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, Logger } from '@nestjs/common';
import { Testimonial } from '../model/testimonial.entity';

@Injectable()
export class TestimonialsService {
  private readonly MAX_LIMIT = 5;
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialsRepository: EntityRepository<Testimonial>,
    private readonly em: EntityManager
  ) {}

  async findAll(): Promise<Testimonial[]> {
    this.logger.debug(`Find all testimonials`);
    return this.testimonialsRepository.findAll();
  }

  async createTestimonial(
    message: string,
    name: string,
    title: string
  ): Promise<Testimonial> {
    this.logger.debug(
      `Create a testimonial. Name: ${message}, title: ${title}, message: ${message}`
    );

    const connection = this.em.getConnection();
    const legacyTestimonials: Testimonial[] = await connection.execute(
      `select * from testimonial where id is not null order by created_at`
    );

    if (legacyTestimonials?.length >= this.MAX_LIMIT) {
      const ids = legacyTestimonials
        .splice(-1 * (this.MAX_LIMIT - 1))
        .map((x: Testimonial) => x.id);

      await connection.execute('delete from testimonial where id not in(?)', [
        ids
      ]);
    }

    const t = new Testimonial();
    t.message = message;
    t.name = name;
    t.title = title;

    await this.em.persistAndFlush(t);
    this.logger.debug(`Saved new testimonial`);

    return t;
  }

  async count(query: string): Promise<number> {
    try {
      this.logger.debug(`Counting testimonials with query: ${query}`);

      // Validate and sanitize the query parameter
      if (typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Invalid query parameter');
      }

      const sanitizedQuery = query.trim().replace(/[%_]/g, ''); // Remove special characters if needed

      // Use parameterized queries to prevent SQL injection
      const count = await this.testimonialsRepository.count({
        message: { $ilike: `%${sanitizedQuery}%` },
      });

      return count;
    } catch (err) {
      this.logger.warn(`Failed to execute count query. Error: ${err.message}`);
      throw new Error('Failed to count testimonials'); // Avoid exposing raw error messages
    }
  }
}
