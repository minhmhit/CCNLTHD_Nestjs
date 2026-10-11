import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { User } from 'src/users/entities/user.entity';
import { Resource } from 'src/resources/entities/resource.entity';
import { Schedule } from 'src/schedules/entities/schedule.entity';
import { Role } from 'src/users/enums/role.enum';
import { ScheduleStatus } from 'src/schedules/enums/schedule-status.enum';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app =
    await NestFactory.createApplicationContext(AppModule);

  const usersRepository = app.get<Repository<User>>(
    getRepositoryToken(User),
  );
  const resourcesRepository = app.get<Repository<Resource>>(
    getRepositoryToken(Resource),
  );
  const schedulesRepository = app.get<Repository<Schedule>>(
    getRepositoryToken(Schedule),
  );

  // Clean tables theo thứ tự đảo ngược FK
  await schedulesRepository.query(
    'TRUNCATE TABLE schedules RESTART IDENTITY CASCADE',
  );
  await resourcesRepository.query(
    'TRUNCATE TABLE resources RESTART IDENTITY CASCADE',
  );
  await usersRepository.query(
    'TRUNCATE TABLE users RESTART IDENTITY CASCADE',
  );

  // ── 1. Seed Users ──────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const [admin, member1, member2] =
    await usersRepository.save([
      {
        email: 'admin@example.com',
        password: passwordHash,
        fullName: 'Admin System',
        role: Role.ADMIN,
      },
      {
        email: 'member1@example.com',
        password: passwordHash,
        fullName: 'Nguyen Van A',
        role: Role.MEMBER,
      },
      {
        email: 'member2@example.com',
        password: passwordHash,
        fullName: 'Tran Thi B',
        role: Role.MEMBER,
      },
    ]);

  // ── 2. Seed Resources ─────────────────────────────
  const [roomTokyo, hallDiamond, advisorRoom] =
    await resourcesRepository.save([
      {
        name: 'Phòng họp Tokyo',
        capacity: 10,
        isActive: true,
      },
      {
        name: 'Hội trường Diamond',
        capacity: 50,
        isActive: true,
      },
      {
        name: 'Phòng Cố vấn 1',
        capacity: 4,
        isActive: true,
      },
    ]);

  // ── 3. Seed Schedules (3 lịch hẹn mẫu trong tuần tới) ──
  const now = new Date();
  const nextDay = (
    daysFromNow: number,
    startHour: number,
    endHour: number,
  ) => {
    const start = new Date(now);
    start.setDate(now.getDate() + daysFromNow);
    start.setHours(startHour, 0, 0, 0);

    const end = new Date(start);
    end.setHours(endHour, 0, 0, 0);

    return { startTime: start, endTime: end };
  };

  await schedulesRepository.save([
    {
      title: 'Họp Kickoff Dự án Q4',
      description:
        'Họp khởi động dự án quý 4 với toàn team',
      ...nextDay(1, 9, 11),
      status: ScheduleStatus.CONFIRMED,
      userId: admin.id,
      resourceId: hallDiamond.id,
    },
    {
      title: 'Review Sprint 3',
      description: 'Đánh giá kết quả Sprint 3 với nhóm dev',
      ...nextDay(2, 14, 15),
      status: ScheduleStatus.CONFIRMED,
      userId: member1.id,
      resourceId: roomTokyo.id,
    },
    {
      title: 'Tư vấn hướng nghiệp',
      description: undefined,
      ...nextDay(3, 10, 11),
      status: ScheduleStatus.PENDING,
      userId: member2.id,
      resourceId: advisorRoom.id,
    },
  ]);

  console.log(
    'Seeding scheduling data completed successfully!',
  );
  await app.close();
}

seed().catch((error: unknown) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
