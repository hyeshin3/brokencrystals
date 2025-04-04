import { MikroORMOptions } from '@mikro-orm/core';
import { Testimonial } from './src/model/testimonial.entity';

const config: MikroORMOptions = {
  entities: [Testimonial],
  dbName: 'your_database_name',
  type: 'postgresql',
  user: 'your_db_user',
  password: 'your_db_password',
  host: 'localhost',
  port: 5432,
};

export default config;