import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { UserType } from '../../auth/user.entity'
import { Purpose, ReservationStatus, ResourceType } from '../entities/reservation.entity'

/**
 * 创建预约 DTO
 */
export class CreateReservationDto {
  @ApiProperty({ description: '资源ID (场地ID或体育设施ID)' })
  @IsInt()
  resourceId: number

  @ApiProperty({ description: '资源类型', enum: ResourceType })
  @IsEnum(ResourceType)
  resourceType: ResourceType

  @ApiProperty({ description: '使用日期', example: '2025-05-26' })
  @IsDateString()
  useDate: string

  @ApiProperty({ description: '开始第几节课 (1-11)', example: 1 })
  @IsInt()
  @Min(1)
  @Max(11)
  startPeriod: number

  @ApiProperty({ description: '结束第几节课 (1-11)', example: 2 })
  @IsInt()
  @Min(1)
  @Max(11)
  endPeriod: number

  @ApiProperty({ description: '使用目的', enum: Purpose })
  @IsEnum(Purpose)
  purpose: Purpose

  @ApiPropertyOptional({ description: '参与人数' })
  @IsOptional()
  @IsInt()
  @Min(1)
  attendeeCount?: number
}

/**
 * 预约查询 DTO
 */
export class ReservationQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10

  @ApiPropertyOptional({ description: '预约状态', enum: ReservationStatus })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus

  @ApiPropertyOptional({ description: '用户类型', enum: UserType })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType

  @ApiPropertyOptional({ description: '使用日期', example: '2025-05-26' })
  @IsOptional()
  @IsDateString()
  useDate?: string

  @ApiPropertyOptional({ description: '资源类型', enum: ResourceType })
  @IsOptional()
  @IsEnum(ResourceType)
  resourceType?: ResourceType

  @ApiPropertyOptional({ description: '用户ID（用于筛选特定用户的预约）' })
  @IsOptional()
  @IsInt()
  userId?: number
}

/**
 * 预约审核 DTO
 */
export class AuditReservationDto {
  @ApiProperty({ description: '审核结果', enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected'

  @ApiPropertyOptional({ description: '拒绝原因' })
  @IsOptional()
  @IsString()
  rejectReason?: string
}

/**
 * 预约响应 DTO
 */
export class ReservationResponseDto {
  @ApiProperty({ description: '预约ID' })
  id: number

  @ApiProperty({ description: '资源ID' })
  resourceId: number

  @ApiProperty({ description: '资源类型', enum: ResourceType })
  resourceType: ResourceType

  @ApiProperty({ description: '预约用户ID' })
  userId: number

  @ApiProperty({ description: '预约人姓名' })
  userName: string

  @ApiProperty({ description: '用户类型', enum: UserType })
  userType: UserType

  @ApiProperty({ description: '使用日期' })
  useDate: string

  @ApiProperty({ description: '开始第几节课' })
  startPeriod: number

  @ApiProperty({ description: '结束第几节课' })
  endPeriod: number

  @ApiProperty({ description: '使用目的', enum: Purpose })
  purpose: Purpose

  @ApiPropertyOptional({ description: '参与人数' })
  attendeeCount?: number

  @ApiProperty({ description: '预约状态', enum: ReservationStatus })
  status: ReservationStatus

  @ApiPropertyOptional({ description: '审核人ID' })
  auditUserId?: number

  @ApiPropertyOptional({ description: '审核时间' })
  auditTime?: string

  @ApiPropertyOptional({ description: '拒绝原因' })
  rejectReason?: string

  @ApiProperty({ description: '创建时间' })
  createdAt: string

  @ApiProperty({ description: '更新时间' })
  updatedAt: string
}

/**
 * 预约分页响应 DTO
 */
export class ReservationPageResponseDto {
  @ApiProperty({ description: '总记录数' })
  total: number

  @ApiProperty({ description: '当前页码' })
  page: number

  @ApiProperty({ description: '每页条数' })
  limit: number

  @ApiProperty({ description: '预约列表', type: [ReservationResponseDto] })
  items: ReservationResponseDto[]
}
