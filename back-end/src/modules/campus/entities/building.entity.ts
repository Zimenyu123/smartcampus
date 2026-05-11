import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { RoomEntity } from './room.entity'

export enum BuildingType {
  DORMITORY = 'dormitory', // 宿舍楼
  ADMINISTRATIVE = 'administrative', // 行政楼
}

@Entity('buildings')
export class BuildingEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    type: 'varchar',
    length: 100,
    comment: '建筑名称',
  })
  buildingName: string

  @Column({
    type: 'enum',
    enum: BuildingType,
    comment: '建筑类型',
  })
  buildingType: BuildingType

  @Column({
    type: 'varchar',
    length: 200,
    comment: '建筑地址',
  })
  address: string

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
  @OneToMany(() => RoomEntity, room => room.building)
  rooms: RoomEntity[]
}
