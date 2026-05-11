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
import { CreateReservationDto } from '../dto/reservation.dto'
import { ReservationService } from '../services/reservation.service'

@ApiTags('预约管理')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '提交预约申请',
    description: '提交预约申请，系统会自动验证时间段是否冲突。用户可以选择房间或体育设施进行预约，系统会检查该时间段是否已被其他用户预约，避免时间冲突。预约提交后需要管理员审核。\n\n**验证规则：**\n- 节数范围：开始节数和结束节数必须在1-11之间\n- 最少预约两节课：开始节数和结束节数不能相同\n- 时间段有效性：开始节数不能晚于结束节数\n- 时间冲突检查：不能与已批准或待审核的预约时间段冲突\n- 资源存在性：确保房间或体育设施存在\n\n**资源类型枚举：**\n- room-房间（教室、会议室等）\n- sports_facility-体育设施（篮球场、游泳池等）\n\n**用途类型枚举：**\n- activity-活动（社团活动、比赛等）\n- exam-考试（期末考试、补考等）\n- class-上课（正常课程）\n- sports-运动（体育锻炼）\n\n**预约状态枚举：**\n- pending-待审核（等待管理员审核）\n- approved-已通过（审核通过，可以正常使用）\n- rejected-已拒绝（审核被拒绝，不能使用）',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        resourceId: {
          type: 'number',
          description: '资源ID（房间ID或设施ID）。系统会验证该资源是否存在。',
          example: 1,
        },
        resourceType: {
          type: 'string',
          enum: ['room', 'sports_facility'],
          description: '资源类型枚举：room-房间（教室、会议室等），sports_facility-体育设施（篮球场、游泳池等）',
        },
        useDate: {
          type: 'string',
          description: '使用日期 (YYYY-MM-DD格式)。系统会检查该日期是否有时间冲突。',
          example: '2024-01-15',
        },
        startPeriod: {
          type: 'number',
          description: '开始节次 (1-11，对应课程时间段)。必须小于等于结束节次，且不能与结束节次相同。',
          example: 1,
          minimum: 1,
          maximum: 11,
        },
        endPeriod: {
          type: 'number',
          description: '结束节次 (1-11，对应课程时间段)。必须大于等于开始节次，且不能与开始节次相同。',
          example: 2,
          minimum: 1,
          maximum: 11,
        },
        purpose: {
          type: 'string',
          enum: ['activity', 'exam', 'class', 'sports'],
          description: '用途枚举：activity-活动（社团活动、比赛等），exam-考试（期末考试、补考等），class-上课（正常课程），sports-运动（体育锻炼）',
        },
        attendeeCount: {
          type: 'number',
          description: '参与人数（可选字段）',
          example: 30,
          minimum: 1,
        },
      },
      required: ['resourceId', 'resourceType', 'useDate', 'startPeriod', 'endPeriod', 'purpose'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '预约申请提交成功。预约已创建，等待管理员审核。',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '预约ID' },
        message: { type: 'string', description: '成功消息' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误或验证失败。可能的错误包括：\n- 节数必须在1-11之间\n- 每次预约最少要预约两节课，开始节数和结束节数不能相同\n- 开始时间不能晚于结束时间\n- 该时间段已被预约（时间冲突）\n- 场地不存在或体育设施不存在',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '具体错误信息' },
        error: { type: 'string', description: '错误类型' },
        statusCode: { type: 'number', description: 'HTTP状态码' },
      },
    },
  })
  async createReservation(@Body() createReservationDto: CreateReservationDto, @Request() req) {
    console.log('=== 控制器接收到的数据 ===')
    console.log('原始请求数据:', createReservationDto)
    console.log('用户信息:', req.user)

    console.log('=== 控制器调试结束 ===')

    return this.reservationService.createReservation(createReservationDto, req.user.id)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '获取预约列表',
    description: '获取预约列表，分页返回所有人的预约信息。支持按用户ID筛选，可以指定查看特定用户的预约。\n\n**预约状态枚举：**\n- pending-待审核（等待管理员审核）\n- approved-已通过（审核通过，可以正常使用）\n- rejected-已拒绝（审核被拒绝，不能使用）\n\n**资源类型枚举：**\n- room-房间（教室、会议室等）\n- sports_facility-体育设施（篮球场、游泳池等）\n\n**用途类型枚举：**\n- activity-活动（社团活动、比赛等）\n- exam-考试（期末考试、补考等）\n- class-上课（正常课程）\n- sports-运动（体育锻炼）',
  })
  @ApiQuery({ name: 'userId', description: '用户ID（可选）。指定查看特定用户的预约，不指定则返回所有用户的预约。', required: false })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', description: '预约ID' },
          resourceId: { type: 'number', description: '资源ID' },
          resourceType: {
            type: 'string',
            enum: ['room', 'sports_facility'],
            description: '资源类型枚举：room-房间（教室、会议室等），sports_facility-体育设施（篮球场、游泳池等）',
          },
          resourceName: { type: 'string', description: '资源名称' },
          userName: { type: 'string', description: '预约人姓名' },
          userType: {
            type: 'string',
            enum: ['student', 'teacher', 'admin'],
            description: '用户类型枚举：student-学生，teacher-教师，admin-管理员',
          },
          useDate: { type: 'string', description: '使用日期' },
          startPeriod: { type: 'number', description: '开始节次' },
          endPeriod: { type: 'number', description: '结束节次' },
          purpose: {
            type: 'string',
            enum: ['activity', 'exam', 'class', 'sports'],
            description: '用途枚举：activity-活动（社团活动、比赛等），exam-考试（期末考试、补考等），class-上课（正常课程），sports-运动（体育锻炼）',
          },
          attendeeCount: { type: 'number', description: '参与人数' },
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected'],
            description: '预约状态枚举：pending-待审核（等待管理员审核），approved-已通过（审核通过，可以正常使用），rejected-已拒绝（审核被拒绝，不能使用）',
          },
          createdAt: { type: 'string', description: '创建时间' },
        },
      },
    },
  })
  async getReservations(@Query('userId') userId?: number) {
    // 构建查询DTO
    const query = {
      page: 1,
      limit: 100,
      userId,
    }
    return this.reservationService.getReservations(query)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '获取预约详情',
    description: '获取预约详情，返回预约的完整信息，包括资源信息、用户信息、时间安排、审核状态等。\n\n**预约状态枚举：**\n- pending-待审核（等待管理员审核）\n- approved-已通过（审核通过，可以正常使用）\n- rejected-已拒绝（审核被拒绝，不能使用）\n\n**资源类型枚举：**\n- room-房间（教室、会议室等）\n- sports_facility-体育设施（篮球场、游泳池等）\n\n**用途类型枚举：**\n- activity-活动（社团活动、比赛等）\n- exam-考试（期末考试、补考等）\n- class-上课（正常课程）\n- sports-运动（体育锻炼）',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '预约ID' },
        resourceId: { type: 'number', description: '资源ID' },
        resourceType: {
          type: 'string',
          enum: ['room', 'sports_facility'],
          description: '资源类型：room-房间，sports_facility-体育设施',
        },
        resourceName: { type: 'string', description: '资源名称' },
        userName: { type: 'string', description: '预约人姓名' },
        userType: {
          type: 'string',
          enum: ['student', 'teacher', 'admin'],
          description: '用户类型：student-学生，teacher-教师，admin-管理员',
        },
        useDate: { type: 'string', description: '使用日期' },
        startPeriod: { type: 'number', description: '开始节次' },
        endPeriod: { type: 'number', description: '结束节次' },
        purpose: {
          type: 'string',
          enum: ['activity', 'exam', 'class', 'sports'],
          description: '用途：activity-活动，exam-考试，class-上课，sports-运动',
        },
        attendeeCount: { type: 'number', description: '参与人数' },
        status: {
          type: 'string',
          enum: ['pending', 'approved', 'rejected'],
          description: '状态：pending-待审核，approved-已通过，rejected-已拒绝',
        },
        auditUserId: { type: 'number', description: '审核人ID' },
        auditTime: { type: 'string', description: '审核时间' },
        rejectReason: { type: 'string', description: '拒绝原因' },
        createdAt: { type: 'string', description: '创建时间' },
        updatedAt: { type: 'string', description: '更新时间' },
      },
    },
  })
  async getReservationDetail(@Param('id') id: number) {
    return this.reservationService.getReservationDetail(id)
  }

  @Put(':id/audit')
  @UseGuards(JwtAuthGuard)
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '审核预约申请（管理员）',
    description: '管理员审核预约申请，可以批准或拒绝。审核通过后用户可以使用预约的资源，拒绝时需要提供拒绝原因。只有管理员有权限进行审核操作。\n\n审核结果枚举：approved-批准（预约申请通过），rejected-拒绝（预约申请被拒绝）\n预约状态枚举：pending-待审核（等待管理员审核），approved-已通过（审核通过，可以正常使用），rejected-已拒绝（审核被拒绝，不能使用）',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['approved', 'rejected'],
          description: '审核结果枚举：approved-批准（预约申请通过），rejected-拒绝（预约申请被拒绝）',
        },
        rejectReason: {
          type: 'string',
          description: '拒绝原因（当status为rejected时必填）',
          example: '时间段冲突',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '审核成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '预约ID' },
        status: {
          type: 'string',
          enum: ['pending', 'approved', 'rejected'],
          description: '预约状态',
        },
        message: { type: 'string', description: '审核结果消息' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，只有管理员可以审核。普通用户无法执行审核操作。',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '错误消息' },
      },
    },
  })
  async auditReservation(
    @Param('id') id: number,
    @Body() auditDto: { status: 'approved' | 'rejected', rejectReason?: string },
    @Request() req,
  ) {
    // 检查是否为管理员
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('只有管理员可以审核预约')
    }

    const dto = {
      status: auditDto.status,
      rejectReason: auditDto.rejectReason,
    }

    return this.reservationService.auditReservation(id, dto, req.user.id)
  }

  @Get('pending/list')
  @UseGuards(JwtAuthGuard)
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '获取待审核预约列表',
    description: '获取所有待审核的预约申请。可以通过此接口查看所有需要审核的预约，方便批量处理。\n\n预约状态枚举：pending-待审核（等待管理员审核），approved-已通过（审核通过，可以正常使用），rejected-已拒绝（审核被拒绝，不能使用）\n资源类型枚举：room-房间，facility-体育设施\n用途类型枚举：activity-活动（会议、培训等），exam-考试（考试用），meeting-会议（会议用），training-培训（培训用）',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', description: '预约ID' },
          resourceId: { type: 'number', description: '资源ID' },
          resourceType: {
            type: 'string',
            enum: ['room', 'facility'],
            description: '资源类型',
          },
          resourceName: { type: 'string', description: '资源名称' },
          userName: { type: 'string', description: '预约人姓名' },
          userType: {
            type: 'string',
            enum: ['student', 'teacher', 'admin'],
            description: '用户类型',
          },
          useDate: { type: 'string', description: '使用日期' },
          startPeriod: { type: 'number', description: '开始节次' },
          endPeriod: { type: 'number', description: '结束节次' },
          purpose: {
            type: 'string',
            enum: ['activity', 'exam', 'meeting', 'training'],
            description: '用途',
          },
          attendeeCount: { type: 'number', description: '参与人数' },
          createdAt: { type: 'string', description: '创建时间' },
        },
      },
    },
  })
  async getPendingReservations() {
    const query = { status: 'pending' as any }
    return this.reservationService.getReservations(query)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '删除预约（管理员专用）',
    description: '管理员可以删除任何预约记录。此操作不可恢复，请谨慎使用。\n\n**权限要求：**\n- 只有管理员可以执行此操作\n- 普通用户无法删除预约\n\n**预约状态枚举：**\n- pending-待审核（等待管理员审核）\n- approved-已通过（审核通过，可以正常使用）\n- rejected-已拒绝（审核被拒绝，不能使用）',
  })
  @ApiResponse({
    status: 200,
    description: '预约删除成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '成功消息' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '权限不足。只有管理员可以删除预约。',
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
    description: '预约不存在',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '错误消息' },
        error: { type: 'string', description: '错误类型' },
        statusCode: { type: 'number', description: 'HTTP状态码' },
      },
    },
  })
  async deleteReservation(@Param('id') id: number, @Request() req) {
    // 检查用户权限
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('只有管理员可以删除预约')
    }

    return this.reservationService.deleteReservation(id)
  }
}
