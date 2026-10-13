import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsReminderSentToSchedule1791858496631 implements MigrationInterface {
  name = 'AddIsReminderSentToSchedule1791858496631';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD "isReminderSent" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP COLUMN "isReminderSent"`,
    );
  }
}
