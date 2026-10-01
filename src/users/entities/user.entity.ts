import { Todo } from 'src/todos/entities/todo.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Todo[];

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt?: Date;
}
