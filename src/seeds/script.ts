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
  const passwordHash = await bcrypt.hash('123456', 10);

  const [admin, member1, member2] =
    await usersRepository.save([
      {
        email: 'minhmhit.sgu@gmail.com',
        password: passwordHash,
        fullName: 'Mai Minh',
        role: Role.ADMIN,
      },
      {
        email: 'nam@gmail.com',
        password: passwordHash,
        fullName: 'Nam Bình Dương',
        role: Role.MEMBER,
      },
      {
        email: 'hai@gmail.com',
        password: passwordHash,
        fullName: 'Hải Lâm Hà',
        role: Role.MEMBER,
      },
    ]);

  // ── 2. Seed Resources ─────────────────────────────
  const [roomTokyo,
    hallDiamond,
    advisorRoom,
    roomLondon,
    roomNewYork,
    hallRuby,
    hallSapphire,
    advisorRoom2,
    advisorRoomVIP,
    trainingRoom1,
    trainingRoom2,
    interviewRoomA,
    creativeSpace] =
    await resourcesRepository.save([
      {
        name: 'Phòng họp cấp cao',
        capacity: 10,
        isActive: true,
      },
      {
        name: 'Hội trường lầu 1',
        capacity: 50,
        isActive: true,
      },
      {
        name: 'Phòng họp nhóm 01',
        capacity: 4,
        isActive: true,
      },
      {
        name: 'Phòng họp chuyên gia',
        capacity: 12,
        isActive: true,
      },
      {
        name: 'Phòng nghỉ ngơi',
        capacity: 8,
        isActive: true,
      },
      {
        name: 'Hội trường lầu 7',
        capacity: 120,
        isActive: true,
      },
      {
        name: 'Hội trường lầu 6',
        capacity: 80,
        isActive: true,
      },
      {
        name: 'Phòng Cố vấn 2',
        capacity: 4,
        isActive: true,
      },
      {
        name: 'Phòng Cố vấn VIP',
        capacity: 6,
        isActive: true,
      },
      {
        name: 'Phòng Đào tạo 1',
        capacity: 30,
        isActive: true,
      },
      {
        name: 'Phòng Đào tạo 2',
        capacity: 35,
        isActive: false,
      },
      {
        name: 'Phòng Phỏng vấn 1',
        capacity: 2,
        isActive: true,
      },
      {
        name: 'Không gian Sáng tạo',
        capacity: 20,
        isActive: true,
      }
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
    {
      title: 'Đào tạo nhân sự mới',
      description: 'Buổi định hướng và đào tạo quy trình cho các nhân viên mới',
      ...nextDay(4, 8, 11),
      status: ScheduleStatus.CONFIRMED,
      userId: admin.id,
      resourceId: trainingRoom2.id,
    },
    {
      title: 'Phỏng vấn ứng viên Frontend',
      description: 'Phỏng vấn kỹ thuật vòng 2',
      ...nextDay(2, 9, 10),
      status: ScheduleStatus.PENDING,
      userId: member1.id,
      resourceId: interviewRoomA.id,
    },
    {
      title: 'Brainstorming chiến lược Marketing',
      description: undefined,
      ...nextDay(5, 14, 16),
      status: ScheduleStatus.CONFIRMED,
      userId: member2.id,
      resourceId: creativeSpace.id,
    },
    {
      title: 'Báo cáo tài chính tháng',
      description: 'Báo cáo tổng kết thu chi và doanh thu tháng trước',
      ...nextDay(6, 10, 12),
      status: ScheduleStatus.CONFIRMED,
      userId: admin.id,
      resourceId: hallRuby.id,
    },
    {
      title: 'Họp 1-1 định kỳ',
      description: 'Review mục tiêu cá nhân hàng tháng',
      ...nextDay(1, 15, 16),
      status: ScheduleStatus.PENDING,
      userId: member1.id,
      resourceId: advisorRoom2.id,
    },
    {
      title: 'Workshop Kỹ năng mềm',
      description: 'Workshop cải thiện kỹ năng giao tiếp và làm việc nhóm',
      ...nextDay(7, 13, 17),
      status: ScheduleStatus.PENDING,
      userId: member2.id,
      resourceId: hallSapphire.id,
    },
    {
      title: 'Gặp gỡ đối tác chiến lược',
      description: 'Thảo luận hợp đồng hợp tác năm tới',
      ...nextDay(3, 14, 15),
      status: ScheduleStatus.CONFIRMED,
      userId: admin.id,
      resourceId: advisorRoomVIP.id,
    },
    {
      title: 'Daily Standup Team Mobile',
      description: undefined,
      ...nextDay(1, 8, 9),
      status: ScheduleStatus.CONFIRMED,
      userId: member1.id,
      resourceId: roomLondon.id,
    },
    {
      title: 'Lên kế hoạch sự kiện cuối năm',
      description: 'Bàn bạc ý tưởng cho tiệc Year End Party',
      ...nextDay(8, 15, 17),
      status: ScheduleStatus.CANCELLED,
      userId: member2.id,
      resourceId: roomNewYork.id,
    },
    {
      title: 'Đánh giá KPI Quý 3',
      description: 'Tổng kết và đánh giá hiệu suất công việc toàn bộ phận',
      ...nextDay(10, 9, 11),
      status: ScheduleStatus.CONFIRMED,
      userId: admin.id,
      resourceId: trainingRoom1.id,
    }
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
