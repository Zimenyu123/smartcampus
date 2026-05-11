import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { BuildingEntity } from './building.entity'

export enum RoomType {
  CLASSROOM = 'classroom', // 教室
  MEETING = 'meeting', // 会议室
  LABORATORY = 'laboratory', // 实验室
  DORMITORY = 'dormitory', // 宿舍
}

@Entity('rooms')
export class RoomEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    type: 'varchar',
    length: 100,
    comment: '场地名称',
  })
  roomName: string

  @Column({
    type: 'enum',
    enum: RoomType,
    comment: '场地类型',
  })
  roomType: RoomType

  @Column({
    type: 'int',
    comment: '楼层号',
  })
  floorNo: number

  @Column({
    type: 'int',
    comment: '座位数/床位数量',
  })
  capacity: number

  @Column({
    type: 'int',
    nullable: true,
    comment: '考试座位数',
  })
  examCapacity: number

  @Column({
    type: 'boolean',
    default: false,
    comment: '是否可对外使用',
  })
  isPublic: boolean

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

  // 关联关系
  @ManyToOne(() => BuildingEntity, building => building.rooms)
  @JoinColumn({ name: 'building_id' })
  building: BuildingEntity
}
