import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/users/enums/role.enum';
import { Resource } from '../src/resources/entities/resource.entity';

/**
 * Seed initial test users and resources into the test database if they do not exist yet.
 * Ensures tests can run isolated on the dedicated test database (port 5433).
 */
export async function seedTestDatabase(
  app: INestApplication,
): Promise<void> {
  const userRepository = app.get<Repository<User>>(
    getRepositoryToken(User),
  );
  const resourceRepository = app.get<Repository<Resource>>(
    getRepositoryToken(Resource),
  );

  const admin = await userRepository.findOne({
    where: { email: 'admin@example.com' },
  });

  if (!admin) {
    const passwordHash = await bcrypt.hash(
      'password123',
      10,
    );

    await userRepository.save([
      {
        email: 'admin@example.com',
        password: passwordHash,
        fullName: 'Admin Test',
        role: Role.ADMIN,
      },
      {
        email: 'member1@example.com',
        password: passwordHash,
        fullName: 'Member One',
        role: Role.MEMBER,
      },
      {
        email: 'member2@example.com',
        password: passwordHash,
        fullName: 'Member Two',
        role: Role.MEMBER,
      },
    ]);
  }

  const resourceCount = await resourceRepository.count();
  if (resourceCount === 0) {
    await resourceRepository.save([
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
    ]);
  }
}
