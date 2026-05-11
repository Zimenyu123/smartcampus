import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository } from 'typeorm'
import {
  CreateMaintenanceReportDto,
  HandleMaintenanceReportDto,
  MaintenancePageResponseDto,
  MaintenanceQueryDto,
  MaintenanceReportResponseDto,
} from '../dto/maintenance.dto'
import { BuildingEntity } from '../entities/building.entity'
import { MaintenanceReportEntity, MaintenanceStatus } from '../entities/maintenance-report.entity'
import { RoomEntity } from '../entities/room.entity'
import { SportsFacilityEntity } from '../entities/sports-facility.entity'

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceReportEntity)
    private maintenanceReportRepository: Repository<MaintenanceReportEntity>,
    @InjectRepository(BuildingEntity)
    private buildingRepository: Repository<BuildingEntity>,
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    @InjectRepository(SportsFacilityEntity)
    private sportsFacilityRepository: Repository<SportsFacilityEntity>,
  ) {}

  /**
   * 创建保修申请
   */
  async createMaintenanceReport(dto: CreateMaintenanceReportDto): Promise<MaintenanceReportResponseDto> {
    // 验证关联的实体是否存在
    if (dto.buildingId) {
      const building = await this.buildingRepository.findOne({
        where: { id: dto.buildingId },
      })
      if (!building) {
        throw new NotFoundException('建筑不存在')
      }
    }

    if (dto.roomId) {
      const room = await this.roomRepository.findOne({
        where: { id: dto.roomId },
      })
      if (!room) {
        throw new NotFoundException('房间不存在')
      }
    }

    if (dto.facilityId) {
      const facility = await this.sportsFacilityRepository.findOne({
        where: { id: dto.facilityId },
      })
      if (!facility) {
        throw new NotFoundException('体育设施不存在')
      }
    }

    // 创建保修申请
    const maintenanceReport = this.maintenanceReportRepository.create({
      applicant: dto.applicant,
      phone: dto.phone,
      description: dto.description,
      locationType: dto.locationType,
      buildingId: dto.buildingId,
      roomId: dto.roomId,
      facilityId: dto.facilityId,
      locationDetail: dto.locationDetail,
      status: MaintenanceStatus.PENDING,
    })

    const savedReport = await this.maintenanceReportRepository.save(maintenanceReport)

    return this.mapToResponseDto(savedReport)
  }

  /**
   * 获取保修列表
   */
  async getMaintenanceReports(query: MaintenanceQueryDto): Promise<MaintenancePageResponseDto> {
    const { page = 1, limit = 10, status, locationType, applicant } = query

    // 构建查询条件
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (locationType) {
      where.locationType = locationType
    }

    if (applicant) {
      where.applicant = Like(`%${applicant}%`)
    }

    // 查询总数
    const total = await this.maintenanceReportRepository.count({ where })

    // 查询保修列表
    const reports = await this.maintenanceReportRepository.find({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return {
      total,
      page,
      limit,
      items: reports.map(report => this.mapToResponseDto(report)),
    }
  }

  /**
   * 获取保修详情
   */
  async getMaintenanceReportDetail(id: number): Promise<MaintenanceReportResponseDto> {
    const report = await this.maintenanceReportRepository.findOne({
      where: { id },
    })

    if (!report) {
      throw new NotFoundException('保修申请不存在')
    }

    return this.mapToResponseDto(report)
  }

  /**
   * 处理保修申请
   */
  async handleMaintenanceReport(id: number, dto: HandleMaintenanceReportDto, handlerId: number): Promise<MaintenanceReportResponseDto> {
    const report = await this.maintenanceReportRepository.findOne({
      where: { id },
    })

    if (!report) {
      throw new NotFoundException('保修申请不存在')
    }

    if (report.status !== MaintenanceStatus.PENDING && report.status !== MaintenanceStatus.PROCESSING) {
      throw new BadRequestException('只能处理待处理或处理中的保修申请')
    }

    // 更新保修申请状态
    report.status = dto.status
    report.handlerId = handlerId
    report.handleTime = new Date()

    if (dto.handleResult) {
      report.handleResult = dto.handleResult
    }

    const updatedReport = await this.maintenanceReportRepository.save(report)

    return this.mapToResponseDto(updatedReport)
  }

  /**
   * 获取待处理的保修申请
   */
  async getPendingMaintenanceReports(): Promise<MaintenanceReportResponseDto[]> {
    const reports = await this.maintenanceReportRepository.find({
      where: { status: MaintenanceStatus.PENDING },
      order: { createdAt: 'ASC' },
    })

    return reports.map(report => this.mapToResponseDto(report))
  }

  /**
   * 获取处理中的保修申请
   */
  async getProcessingMaintenanceReports(): Promise<MaintenanceReportResponseDto[]> {
    const reports = await this.maintenanceReportRepository.find({
      where: { status: MaintenanceStatus.PROCESSING },
      order: { createdAt: 'ASC' },
    })

    return reports.map(report => this.mapToResponseDto(report))
  }

  /**
   * 删除保修申请（管理员专用）
   */
  async deleteMaintenanceReport(id: number): Promise<{ message: string }> {
    const report = await this.maintenanceReportRepository.findOne({
      where: { id },
    })

    if (!report) {
      throw new NotFoundException('保修申请不存在')
    }

    await this.maintenanceReportRepository.remove(report)

    return { message: '保修申请删除成功' }
  }

  /**
   * 映射为响应DTO
   */
  private mapToResponseDto(report: MaintenanceReportEntity): MaintenanceReportResponseDto {
    return {
      id: report.id,
      applicant: report.applicant,
      phone: report.phone,
      description: report.description,
      locationType: report.locationType,
      buildingId: report.buildingId,
      roomId: report.roomId,
      facilityId: report.facilityId,
      locationDetail: report.locationDetail,
      submitTime: report.submitTime.toISOString(),
      status: report.status,
      handlerId: report.handlerId,
      handleTime: report.handleTime?.toISOString(),
      handleResult: report.handleResult,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    }
  }
}
