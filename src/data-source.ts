import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { User } from './users/entities/user.entity';
import { Resource } from './resources/entities/resource.entity';
import { Schedule } from './schedules/entities/schedule.entity';

const envFile =
  process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({
  path: path.resolve(process.cwd(), envFile),
  override: true,
});

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Resource, Schedule],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
