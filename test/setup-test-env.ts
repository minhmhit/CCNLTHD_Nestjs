import * as dotenv from 'dotenv';
import * as path from 'path';

// Nạp file .env.test trước khi bất kỳ module nào được import
dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true,
});

process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5433';
process.env.DB_NAME = 'schedule_app_test';
process.env.DB_USER = 'admin';
process.env.DB_PASSWORD = 'admin123';
