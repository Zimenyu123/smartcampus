import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator'
import { LocationType, MaintenanceStatus } from '../entities/maintenance-report.entity'

/**
 * 创建保修申请 DTO
 */
export class CreateMaintenanceReportDto {
  @ApiProperty({ description: '申请人' })
  @IsString()
  @IsNotEmpty()
  applicant: string

  @ApiProperty({ description: '联系电话' })
  @IsString()
  @IsNotEmpty()
  phone: string

  @ApiProperty({ description: '上报内容' })
  @IsString()
  @IsNotEmpty()
  description: string

  @ApiProperty({ description: '位置类型', enum: LocationType })
  @IsEnum(LocationType)
  locationType: LocationType

  @ApiPropertyOptional({ description: '建筑ID' })
  @IsOptional()
  @IsInt()
  buildingId?: number

  @ApiPropertyOptional({ description: '房间ID' })
  @IsOptional()
  @IsInt()
  roomId?: number

  @ApiPropertyOptional({ description: '设施ID' })
  @IsOptional()
  @IsInt()
  facilityId?: number

  @ApiProperty({ description: '具体位置描述' })
  @IsString()
  @IsNotEmpty()
  locationDetail: string
}

/**
 * 保修查询 DTO
 */
export class MaintenanceQueryDto {
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

  @ApiPropertyOptional({ description: '保修状态', enum: MaintenanceStatus })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus

  @ApiPropertyOptional({ description: '位置类型', enum: LocationType })
  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType

  @ApiPropertyOptional({ description: '申请人' })
  @IsOptional()
  @IsString()
  applicant?: string
}

/**
 * 处理保修申请 DTO
 */
export class HandleMaintenanceReportDto {
  @ApiProperty({ description: '处理状态', enum: MaintenanceStatus })
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus

  @ApiPropertyOptional({ description: '处理结果' })
  @IsOptional()
  @IsString()
  handleResult?: string
}

/**
 * 保修响应 DTO
 */
export class MaintenanceReportResponseDto {
  @ApiProperty({ description: '保修ID' })
  id: number

  @ApiProperty({ description: '申请人' })
  applicant: string

  @ApiProperty({ description: '联系电话' })
  phone: string

  @ApiProperty({ description: '上报内容' })
  description: string

  @ApiProperty({ description: '位置类型', enum: LocationType })
  locationType: LocationType

  @ApiPropertyOptional({ description: '建筑ID' })
  buildingId?: number

  @ApiPropertyOptional({ description: '房间ID' })
  roomId?: number

  @ApiPropertyOptional({ description: '设施ID' })
  facilityId?: number

  @ApiProperty({ description: '具体位置描述' })
  locationDetail: string

  @ApiProperty({ description: '提交时间' })
  submitTime: string

  @ApiProperty({ description: '状态', enum: MaintenanceStatus })
  status: MaintenanceStatus

  @ApiPropertyOptional({ description: '处理人ID' })
  handlerId?: number

  @ApiPropertyOptional({ description: '处理时间' })
  handleTime?: string

  @ApiPropertyOptional({ description: '处理结果' })
  handleResult?: string

  @ApiProperty({ description: '创建时间' })
  createdAt: string

  @ApiProperty({ description: '更新时间' })
  updatedAt: string
}

/**
 * 保修分页响应 DTO
 */
export class MaintenancePageResponseDto {
  @ApiProperty({ description: '总记录数' })
  total: number

  @ApiProperty({ description: '当前页码' })
  page: number

  @ApiProperty({ description: '每页条数' })
  limit: number

  @ApiProperty({ description: '保修列表', type: [MaintenanceReportResponseDto] })
  items: MaintenanceReportResponseDto[]
}
