import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum SportType {
  BASKETBALL = 'basketball', // 篮球场
  FOOTBALL = 'football', // 足球场
  SWIMMING = 'swimming', // 游泳池
  GYM = 'gym', // 健身房
  TENNIS = 'tennis', // 网球场
  VOLLEYBALL = 'volleyball', // 排球场
}

@Entity('sports_facilities')
export class SportsFacilityEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    type: 'varchar',
    length: 100,
    comment: '设施名称',
  })
  facilityName: string

  @Column({
    type: 'enum',
    enum: SportType,
    comment: '运动类型',
  })
  sportType: SportType

  @Column({
    type: 'varchar',
    length: 200,
    comment: '地理位置',
  })
  location: string

  @Column({
    type: 'int',
    nullable: true,
    comment: '容纳人数',
  })
  capacity: number

  @Column({
    type: 'varchar',
    length: 100,
    comment: '开放时间',
  })
  openingHours: string

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
}
