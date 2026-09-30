import { Category } from 'src/categories/entities/category.entity';
import { TodoPriority } from 'src/todos/enums/todo-priority.enum';
import { TodoStatus } from 'src/todos/enums/todo-status.enum';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
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
    nullable: true,
  })
  priority?: TodoPriority;

  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.todos)
  @JoinColumn({
    name: 'userId',
    referencedColumnName: 'id',
  })
  user!: User;

  @Column({ nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({
    name: 'categoryId',
    referencedColumnName: 'id',
  })
  category!: Category;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
