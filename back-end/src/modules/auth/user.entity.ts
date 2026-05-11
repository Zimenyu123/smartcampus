import { Exclude } from 'class-transformer'
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum UserType {
  STUDENT = 'student',
  ADMIN = 'admin',
}

@Entity('sys_user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: '用户名',
  })
  username: string

  @Column({
    type: 'varchar',
    length: 255,
    comment: '密码',
  })
  @Exclude()
  password: string

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.STUDENT,
    comment: '用户类型',
  })
  type: UserType

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    comment: '创建时间',
  })
  createdAt: Date

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    comment: '更新时间',
  })
  updatedAt: Date
}
