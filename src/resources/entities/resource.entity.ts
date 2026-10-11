import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Schedule } from 'src/schedules/entities/schedule.entity';

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false })
  name!: string;

  @Column({ type: 'int', nullable: false })
  capacity!: number;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(
    () => Schedule,
    (schedule) => schedule.resource,
  )
  schedules: Schedule[];
}
