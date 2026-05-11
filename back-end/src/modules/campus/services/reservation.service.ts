import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '../../auth/user.entity'
import {
  AuditReservationDto,
  CreateReservationDto,
  ReservationPageResponseDto,
  ReservationQueryDto,
  ReservationResponseDto,
} from '../dto/reservation.dto'
import { ReservationEntity, ReservationStatus, ResourceType } from '../entities/reservation.entity'
import { RoomEntity } from '../entities/room.entity'
import { SportsFacilityEntity } from '../entities/sports-facility.entity'

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(ReservationEntity)
    private reservationRepository: Repository<ReservationEntity>,
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    @InjectRepository(SportsFacilityEntity)
    private sportsFacilityRepository: Repository<SportsFacilityEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  /**
   * 创建预约
   */
  async createReservation(dto: CreateReservationDto, userId: number): Promise<ReservationResponseDto> {
    // 获取用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    // 检查资源是否存在
    if (dto.resourceType === ResourceType.ROOM) {
      const room = await this.roomRepository.findOne({
        where: { id: dto.resourceId },
      })
      if (!room) {
        throw new NotFoundException('场地不存在')
      }
    }
    else {
      const facility = await this.sportsFacilityRepository.findOne({
        where: { id: dto.resourceId },
      })
      if (!facility) {
        throw new NotFoundException('体育设施不存在')
      }
    }

    // 检查时间段是否有效
    if (dto.startPeriod > dto.endPeriod) {
      throw new BadRequestException('开始时间不能晚于结束时间')
    }

    // 检查节数范围 (1-11节课)
    if (dto.startPeriod < 1 || dto.startPeriod > 11 || dto.endPeriod < 1 || dto.endPeriod > 11) {
      throw new BadRequestException('节数必须在1-11之间')
    }

    // 检查最少预约两节课
    if (dto.startPeriod === dto.endPeriod) {
      throw new BadRequestException('每次预约最少要预约两节课，开始节数和结束节数不能相同')
    }

    // 检查是否有冲突的预约
    // 先去查询这个日期的这个房间有没有被预约,不包括已拒绝的预约，和待审核的预约
    const roomReservations = await this.reservationRepository.find({
      where: {
        resourceId: dto.resourceId,
        useDate: new Date(dto.useDate),
        status: ReservationStatus.APPROVED,
      },
    })
    // 如果这个房间在这个日期被预约了，那么就检查这个预约的节数是否和当前预约的节数有冲突
    for (const reservation of roomReservations) {
      if (reservation.startPeriod <= dto.endPeriod && reservation.endPeriod >= dto.startPeriod) {
        throw new BadRequestException('该时间段已被预约')
      }
    }

    // 调试信息
    console.log('=== 创建预约调试信息 ===')
    console.log('DTO数据:', dto)
    console.log('用户ID:', userId)
    console.log('用户信息:', user)
    console.log('SQL参数:', [
      dto.resourceId,
      dto.resourceType,
      userId,
      user.username,
      user.type,
      new Date(dto.useDate),
      dto.startPeriod,
      dto.endPeriod,
      dto.purpose,
      dto.attendeeCount,
      ReservationStatus.PENDING,
    ])

    // 直接使用原始SQL插入，避免TypeORM映射问题
    const result = await this.reservationRepository.query(`
      INSERT INTO reservations (
        resource_id, resource_type, user_id, user_name, user_type, 
        use_date, start_period, end_period, purpose, attendee_count, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dto.resourceId,
      dto.resourceType,
      userId,
      user.username,
      user.type,
      new Date(dto.useDate),
      dto.startPeriod,
      dto.endPeriod,
      dto.purpose,
      dto.attendeeCount,
      ReservationStatus.PENDING,
    ])

    // 获取刚插入的记录
    const savedReservation = await this.reservationRepository.findOne({
      where: { id: result.insertId },
    })

    return this.mapToResponseDto(savedReservation)
  }

  /**
   * 获取预约列表
   */
  async getReservations(query: ReservationQueryDto): Promise<ReservationPageResponseDto> {
    const { page = 1, limit = 10, status, userType, useDate, resourceType, userId: filterUserId } = query

    // 构建查询条件
    const where: any = {}

    // 如果指定了用户ID，则按用户ID筛选
    if (filterUserId) {
      where.userId = filterUserId
    }

    if (status) {
      where.status = status
    }

    if (userType) {
      where.userType = userType
    }

    if (useDate) {
      where.useDate = new Date(useDate)
    }

    if (resourceType) {
      where.resourceType = resourceType
    }

    // 查询总数
    const total = await this.reservationRepository.count({ where })

    // 查询预约列表
    const reservations = await this.reservationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return {
      total,
      page,
      limit,
      items: reservations.map(reservation => this.mapToResponseDto(reservation)),
    }
  }

  /**
   * 获取预约详情
   */
  async getReservationDetail(id: number): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    })

    if (!reservation) {
      throw new NotFoundException('预约不存在')
    }

    return this.mapToResponseDto(reservation)
  }

  /**
   * 取消预约
   */
  async cancelReservation(id: number, userId: number): Promise<void> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    })

    if (!reservation) {
      throw new NotFoundException('预约不存在')
    }

    if (reservation.userId !== userId) {
      throw new ForbiddenException('无权取消此预约')
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('只能取消待审核的预约')
    }

    reservation.status = ReservationStatus.CANCELLED
    await this.reservationRepository.save(reservation)
  }

  /**
   * 审核预约
   */
  async auditReservation(id: number, dto: AuditReservationDto, auditUserId: number): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    })

    if (!reservation) {
      throw new NotFoundException('预约不存在')
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('只能审核待审核的预约')
    }

    // 更新预约状态
    reservation.status = dto.status === 'approved' ? ReservationStatus.APPROVED : ReservationStatus.REJECTED
    reservation.auditUserId = auditUserId
    reservation.auditTime = new Date()

    if (dto.status === 'rejected' && dto.rejectReason) {
      reservation.rejectReason = dto.rejectReason
    }

    const updatedReservation = await this.reservationRepository.save(reservation)

    return this.mapToResponseDto(updatedReservation)
  }

  /**
   * 检查预约冲突
   */
  private async checkReservationConflict(
    resourceId: number,
    resourceType: ResourceType,
    useDate: Date,
    startPeriod: number,
    endPeriod: number,
  ): Promise<boolean> {
    // 查找同一资源、同一日期的所有预约（除了已拒绝的）
    const conflictingReservations = await this.reservationRepository.find({
      where: {
        resourceId,
        resourceType,
        useDate,
        status: ReservationStatus.APPROVED, // 检查已批准的预约
      },
    })

    // 也检查待审核的预约，避免重复申请
    const pendingReservations = await this.reservationRepository.find({
      where: {
        resourceId,
        resourceType,
        useDate,
        status: ReservationStatus.PENDING, // 检查待审核的预约
      },
    })

    // 合并所有需要检查的预约
    const allReservations = [...conflictingReservations, ...pendingReservations]

    // 检查是否有时间冲突
    for (const reservation of allReservations) {
      // 简化冲突判断逻辑：两个时间段有重叠当且仅当：
      // 新预约的开始时间 < 现有预约的结束时间 且 新预约的结束时间 > 现有预约的开始时间
      const hasConflict = (
        startPeriod < reservation.endPeriod && endPeriod > reservation.startPeriod
      )

      if (hasConflict) {
        return true
      }
    }

    return false
  }

  /**
   * 删除预约（管理员专用）
   */
  async deleteReservation(id: number): Promise<{ message: string }> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    })

    if (!reservation) {
      throw new NotFoundException('预约不存在')
    }

    await this.reservationRepository.remove(reservation)

    return { message: '预约删除成功' }
  }

  /**
   * 映射为响应DTO
   */
  private mapToResponseDto(reservation: ReservationEntity): ReservationResponseDto {
    return {
      id: reservation.id,
      resourceId: reservation.resourceId,
      resourceType: reservation.resourceType,
      userId: reservation.userId,
      userName: reservation.userName,
      userType: reservation.userType,
      useDate: reservation.useDate instanceof Date ? reservation.useDate.toISOString().split('T')[0] : reservation.useDate,
      startPeriod: reservation.startPeriod,
      endPeriod: reservation.endPeriod,
      purpose: reservation.purpose,
      attendeeCount: reservation.attendeeCount,
      status: reservation.status,
      auditUserId: reservation.auditUserId,
      auditTime: reservation.auditTime instanceof Date ? reservation.auditTime.toISOString() : reservation.auditTime,
      rejectReason: reservation.rejectReason,
      createdAt: reservation.createdAt instanceof Date ? reservation.createdAt.toISOString() : reservation.createdAt,
      updatedAt: reservation.updatedAt instanceof Date ? reservation.updatedAt.toISOString() : reservation.updatedAt,
    }
  }
}
