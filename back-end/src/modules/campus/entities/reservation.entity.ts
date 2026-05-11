import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { UserType } from '../../auth/user.entity'

export enum ResourceType {
  ROOM = 'room', // 场地
  SPORTS_FACILITY = 'sports_facility', // 体育设施
}

export enum Purpose {
  EXAM = 'exam', // 考试
  ACTIVITY = 'activity', // 活动
  CLASS = 'class', // 上课
  SPORTS = 'sports', // 运动
}

export enum ReservationStatus {
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已拒绝
  CANCELLED = 'cancelled', // 已取消
}

@Entity('reservations')
export class ReservationEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    name: 'resource_id',
    type: 'int',
    comment: '资源ID (场地ID或体育设施ID)',
  })
  resourceId: number

  @Column({
    name: 'resource_type',
    type: 'enum',
    enum: ResourceType,
    comment: '资源类型',
  })
  resourceType: ResourceType

  @Column({
    name: 'user_id',
    type: 'int',
    comment: '预约用户ID',
  })
  userId: number

  @Column({
    name: 'user_name',
    type: 'varchar',
    length: 50,
    comment: '预约人姓名',
  })
  userName: string

  @Column({
    name: 'user_type',
    type: 'enum',
    enum: UserType,
    comment: '用户类型',
  })
  userType: UserType

  @Column({
    name: 'use_date',
    type: 'date',
    comment: '使用日期',
  })
  useDate: Date

  @Column({
    name: 'start_period',
    type: 'int',
    comment: '开始第几节课',
  })
  startPeriod: number

  @Column({
    name: 'end_period',
    type: 'int',
    comment: '结束第几节课',
  })
  endPeriod: number

  @Column({
    type: 'enum',
    enum: Purpose,
    comment: '使用目的',
  })
  purpose: Purpose

  @Column({
    name: 'attendee_count',
    type: 'int',
    nullable: true,
    comment: '参与人数',
  })
  attendeeCount: number

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
    comment: '预约状态',
  })
  status: ReservationStatus

  @Column({
    name: 'audit_user_id',
    type: 'int',
    nullable: true,
    comment: '审核人ID',
  })
  auditUserId: number

  @Column({
    name: 'audit_time',
    type: 'datetime',
    nullable: true,
    comment: '审核时间',
  })
  auditTime: Date

  @Column({
    name: 'reject_reason',
    type: 'text',
    nullable: true,
    comment: '拒绝原因',
  })
  rejectReason: string

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
