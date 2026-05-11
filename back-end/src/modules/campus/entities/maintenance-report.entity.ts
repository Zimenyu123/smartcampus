import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum LocationType {
  BUILDING = 'building', // 建筑
  ROOM = 'room', // 房间
  SPORTS_FACILITY = 'sports_facility', // 体育设施
}

export enum MaintenanceStatus {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 处理中
  COMPLETED = 'completed', // 已完成
  REJECTED = 'rejected', // 已拒绝
}

@Entity('maintenance_reports')
export class MaintenanceReportEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    name: 'applicant',
    type: 'varchar',
    length: 50,
    comment: '申请人',
  })
  applicant: string

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 20,
    comment: '联系电话',
  })
  phone: string

  @Column({
    name: 'description',
    type: 'text',
    comment: '上报内容',
  })
  description: string

  @Column({
    name: 'location_type',
    type: 'enum',
    enum: LocationType,
    comment: '位置类型',
  })
  locationType: LocationType

  @Column({
    name: 'building_id',
    type: 'int',
    nullable: true,
    comment: '建筑ID',
  })
  buildingId: number

  @Column({
    name: 'room_id',
    type: 'int',
    nullable: true,
    comment: '房间ID',
  })
  roomId: number

  @Column({
    name: 'facility_id',
    type: 'int',
    nullable: true,
    comment: '设施ID',
  })
  facilityId: number

  @Column({
    name: 'location_detail',
    type: 'varchar',
    length: 200,
    comment: '具体位置描述',
  })
  locationDetail: string

  @Column({
    name: 'submit_time',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '提交时间',
  })
  submitTime: Date

  @Column({
    name: 'status',
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.PENDING,
    comment: '状态',
  })
  status: MaintenanceStatus

  @Column({
    name: 'handler_id',
    type: 'int',
    nullable: true,
    comment: '处理人ID',
  })
  handlerId: number

  @Column({
    name: 'handle_time',
    type: 'datetime',
    nullable: true,
    comment: '处理时间',
  })
  handleTime: Date

  @Column({
    name: 'handle_result',
    type: 'text',
    nullable: true,
    comment: '处理结果',
  })
  handleResult: string

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
