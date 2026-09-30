import { TodoPriority } from 'src/todos/enums/todo-priority.enum';
import { TodoStatus } from 'src/todos/enums/todo-status.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({
    type: 'enum',
    enum: TodoStatus,
    default: TodoStatus.OPEN,
  })
  status!: TodoStatus;

  @Column({
    type: 'enum',
    enum: TodoPriority,
    default: TodoPriority.MEDIUM,
  })
  priority!: TodoPriority;

  @Column()
  userId!: number;

  @Column({ nullable: true })
  categoryId?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
