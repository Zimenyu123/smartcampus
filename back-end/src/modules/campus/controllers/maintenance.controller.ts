import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ApiSecurityAuth } from '../../../common/decorators/swagger.decorator'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { CreateMaintenanceReportDto } from '../dto/maintenance.dto'
import { MaintenanceStatus } from '../entities/maintenance-report.entity'
import { MaintenanceService } from '../services/maintenance.service'

@ApiTags('报修管理')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '提交报修申请',
    description: '提交报修申请，选择报修位置（建筑、房间或体育设施）。用户需要提供详细的报修信息，包括申请人、联系方式、报修描述、具体位置等。报修提交后需要管理员处理。\n\n位置类型枚举：building-建筑（整栋建筑），room-房间（具体房间），facility-体育设施（体育设施）\n报修状态枚举：pending-待处理（等待管理员处理），processing-处理中（正在维修），completed-已完成（维修完成）',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        applicant: { type: 'string', description: '申请人姓名', example: '张三' },
        phone: { type: 'string', description: '联系电话', example: '13800138000' },
        description: { type: 'string', description: '报修描述', example: '空调不制冷' },
        locationType: {
          type: 'string',
          enum: ['building', 'room', 'sports_facility'],
          description: '位置类型枚举：building-建筑（整栋楼的公共设施），room-房间（具体房间内的设施），sports_facility-体育设施（体育场馆内的设施）',
        },
        buildingId: { type: 'number', description: '建筑ID（当locationType为building或room时必填）', example: 1 },
        roomId: { type: 'number', description: '房间ID（当locationType为room时必填）', example: 101 },
        facilityId: { type: 'number', description: '设施ID（当locationType为sports_facility时必填）', example: 1 },
        locationDetail: { type: 'string', description: '具体位置描述', example: '3楼东侧' },
      },
      required: ['applicant', 'phone', 'description', 'locationType', 'locationDetail'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '报修申请提交成功。报修已创建，等待管理员处理。',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '报修ID' },
        message: { type: 'string', description: '成功消息' },
      },
    },
  })
  async createMaintenance(@Body() createMaintenanceDto: CreateMaintenanceReportDto, @Request() req) {
    return this.maintenanceService.createMaintenanceReport(createMaintenanceDto)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '获取报修列表',
    description: '获取报修列表，管理员可以查看所有用户的报修记录，普通用户只能查看自己的报修记录。支持按用户ID筛选，管理员可以指定查看特定用户的报修。\n\n位置类型枚举：building-建筑（整栋建筑），room-房间（具体房间），facility-体育设施（体育设施）\n报修状态枚举：pending-待处理（等待管理员处理），processing-处理中（正在维修），completed-已完成（维修完成）',
  })
  @ApiQuery({ name: 'userId', description: '用户ID（管理员可选，普通用户忽略）。管理员可以指定查看特定用户的报修，普通用户忽略此参数。', required: false })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', description: '报修ID' },
          applicant: { type: 'string', description: '申请人姓名' },
          phone: { type: 'string', description: '联系电话' },
          description: { type: 'string', description: '报修描述' },
          locationType: {
            type: 'string',
            enum: ['building', 'room', 'facility'],
            description: '位置类型枚举：building-建筑（整栋楼的公共设施），room-房间（具体房间内的设施），facility-体育设施（体育场馆内的设施）',
          },
          buildingId: { type: 'number', description: '建筑ID' },
          roomId: { type: 'number', description: '房间ID' },
          facilityId: { type: 'number', description: '设施ID' },
          locationDetail: { type: 'string', description: '具体位置描述' },
          submitTime: { type: 'string', description: '提交时间' },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'completed'],
            description: '报修状态枚举：pending-待处理（等待管理员处理），processing-处理中（正在维修），completed-已完成（维修完成）',
          },
          handlerId: { type: 'number', description: '处理人ID' },
          handleTime: { type: 'string', description: '处理时间' },
          handleResult: { type: 'string', description: '处理结果' },
        },
      },
    },
  })
  async getMaintenanceReports(@Query('userId') userId?: number, @Request() req?: any) {
    // 使用现有的查询DTO格式
    const query = {
      page: 1,
      limit: 100,
    }
    return this.maintenanceService.getMaintenanceReports(query)
  }

  @Put(':id/handle')
  @UseGuards(JwtAuthGuard)
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '处理报修申请（管理员）',
    description: '管理员处理报修申请，可以标记为处理中或已完成。管理员可以更新报修状态，添加处理结果说明，让用户了解维修进度。只有管理员有权限进行处理操作。\n\n处理状态枚举：processing-处理中（开始维修），completed-已完成（维修完成）\n报修状态枚举：pending-待处理（等待管理员处理），processing-处理中（正在维修），completed-已完成（维修完成）',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['processing', 'completed'],
          description: '处理状态枚举：processing-处理中（开始维修），completed-已完成（维修完成）',
        },
        handleResult: {
          type: 'string',
          description: '处理结果',
          example: '已修复空调故障',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '处理成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '报修ID' },
        status: {
          type: 'string',
          enum: ['pending', 'processing', 'completed'],
          description: '报修状态枚举：pending-待处理（等待管理员处理），processing-处理中（正在维修），completed-已完成（维修完成）',
        },
        message: { type: 'string', description: '处理结果消息' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，只有管理员可以处理报修。普通用户无法执行处理操作。',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '错误消息' },
      },
    },
  })
  async handleMaintenanceReport(
    @Param('id') id: number,
    @Body() handleDto: { status: 'processing' | 'completed', handleResult?: string },
    @Request() req,
  ) {
    // 检查是否为管理员
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('只有管理员可以处理报修申请')
    }

    const dto = {
      status: handleDto.status === 'processing' ? MaintenanceStatus.PROCESSING : MaintenanceStatus.COMPLETED,
      handleResult: handleDto.handleResult,
    }

    return this.maintenanceService.handleMaintenanceReport(id, dto, req.user.id)
  }

  @Get('pending/list')
  @UseGuards(JwtAuthGuard)
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '获取待处理报修列表（管理员）',
    description: '获取所有待处理的报修申请。管理员可以通过此接口查看所有需要处理的报修，方便批量处理。只有管理员有权限访问此接口。\n\n位置类型枚举：building-建筑（整栋建筑），room-房间（具体房间），facility-体育设施（体育设施）\n报修状态枚举：pending-待处理（等待管理员处理），processing-处理中（正在维修），completed-已完成（维修完成）',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', description: '报修ID' },
          applicant: { type: 'string', description: '申请人姓名' },
          phone: { type: 'string', description: '联系电话' },
          description: { type: 'string', description: '报修描述' },
          locationType: {
            type: 'string',
            enum: ['building', 'room', 'facility'],
            description: '位置类型枚举：building-建筑（整栋楼的公共设施），room-房间（具体房间内的设施），facility-体育设施（体育场馆内的设施）',
          },
          buildingId: { type: 'number', description: '建筑ID' },
          roomId: { type: 'number', description: '房间ID' },
          facilityId: { type: 'number', description: '设施ID' },
          locationDetail: { type: 'string', description: '具体位置描述' },
          submitTime: { type: 'string', description: '提交时间' },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'completed'],
            description: '报修状态枚举：pending-待处理（等待管理员处理），processing-处理中（正在维修），completed-已完成（维修完成）',
          },
        },
      },
    },
  })
  async getPendingMaintenanceReports(@Request() req) {
    // 检查是否为管理员
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('只有管理员可以查看待处理报修')
    }

    const query = { status: 'pending' as any }
    return this.maintenanceService.getMaintenanceReports(query)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '删除保修申请（管理员专用）',
    description: '管理员可以删除任何保修申请记录。此操作不可恢复，请谨慎使用。\n\n**权限要求：**\n- 只有管理员可以执行此操作\n- 普通用户无法删除保修申请\n\n**保修状态枚举：**\n- pending-待处理（等待管理员处理）\n- processing-处理中（正在维修）\n- completed-已完成（维修完成）\n- rejected-已拒绝（拒绝维修）',
  })
  @ApiResponse({
    status: 200,
    description: '保修申请删除成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '成功消息' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '权限不足。只有管理员可以删除保修申请。',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '错误消息' },
        error: { type: 'string', description: '错误类型' },
        statusCode: { type: 'number', description: 'HTTP状态码' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '保修申请不存在',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '错误消息' },
        error: { type: 'string', description: '错误类型' },
        statusCode: { type: 'number', description: 'HTTP状态码' },
      },
    },
  })
  async deleteMaintenanceReport(@Param('id') id: number, @Request() req) {
    // 检查用户权限
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('只有管理员可以删除保修申请')
    }

    return this.maintenanceService.deleteMaintenanceReport(id)
  }
}
