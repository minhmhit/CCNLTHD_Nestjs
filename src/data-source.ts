import { DataSource } from 'typeorm';
import 'dotenv/config';
import { User } from './users/entities/user.entity';
import { Resource } from './resources/entities/resource.entity';
import { Schedule } from './schedules/entities/schedule.entity';

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
