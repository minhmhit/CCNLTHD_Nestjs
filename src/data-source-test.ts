import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { User } from './users/entities/user.entity';
import { Resource } from './resources/entities/resource.entity';
import { Schedule } from './schedules/entities/schedule.entity';

// Tải cấu hình độc quyền cho test database
dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true,
});

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'schedule_app_test',
  entities: [User, Resource, Schedule],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
