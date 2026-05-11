import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BuildingEntity } from '../entities/building.entity'
import { RoomEntity } from '../entities/room.entity'
import { SportsFacilityEntity } from '../entities/sports-facility.entity'

export interface CampusStructure {
  buildings: BuildingWithRooms[]
  sportsFacilities: SportsFacilityEntity[]
}

export interface BuildingWithRooms {
  id: number
  buildingName: string
  buildingType: string
  address: string
  rooms: RoomEntity[]
}

@Injectable()
export class CampusService {
  constructor(
    @InjectRepository(BuildingEntity)
    private buildingRepository: Repository<BuildingEntity>,
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    @InjectRepository(SportsFacilityEntity)
    private sportsFacilityRepository: Repository<SportsFacilityEntity>,
  ) {}

  /**
   * 获取校园建筑和体育设施信息
   */
  async getCampusStructure(): Promise<CampusStructure> {
    // 获取所有建筑楼及其房间
    const buildings = await this.buildingRepository.find({
      relations: ['rooms'],
      order: {
        buildingName: 'ASC',
        rooms: {
          floorNo: 'ASC',
        },
      },
    })

    // 获取所有体育设施
    const sportsFacilities = await this.sportsFacilityRepository.find({
      order: {
        facilityName: 'ASC',
      },
    })

    // 构建返回结构
    const buildingWithRooms: BuildingWithRooms[] = buildings.map(building => ({
      id: building.id,
      buildingName: building.buildingName,
      buildingType: building.buildingType,
      address: building.address,
      rooms: building.rooms || [],
    }))

    return {
      buildings: buildingWithRooms,
      sportsFacilities,
    }
  }
}
