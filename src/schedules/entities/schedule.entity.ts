import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScheduleStatus } from '../enums/schedule-status.enum';
import { User } from 'src/users/entities/user.entity';
import { Resource } from 'src/resources/entities/resource.entity';

@Index(['resourceId', 'startTime', 'endTime'])
@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamptz', nullable: false })
  startTime!: Date;

  @Column({ type: 'timestamptz', nullable: false })
  endTime!: Date;

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.CONFIRMED,
  })
  status!: ScheduleStatus;

  @Column({ type: 'boolean', default: false })
  isReminderSent!: boolean;

  @Column({ nullable: false })
  userId!: number;

  @Column({ nullable: false })
  resourceId!: number;

  @ManyToOne(() => User, (user) => user.schedules, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(
    () => Resource,
    (resource) => resource.schedules,
    {
      onDelete: 'RESTRICT',
      nullable: false,
    },
  )
  @JoinColumn({ name: 'resourceId' })
  resource!: Resource;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
