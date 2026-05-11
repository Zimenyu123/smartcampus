import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../auth/decorators/public.decorator'
import { CampusService } from '../services/campus.service'

@ApiTags('校园管理')
@Controller('campus')
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Get('structure')
  @Public()
  @ApiOperation({
    summary: '获取校园建筑和体育设施信息',
    description: '返回所有建筑物信息和体育设施信息，建筑物信息下嵌套对应的房间信息，用于报修服务的双重下拉框效果。该接口用于前端实现省-市-区三级联动选择，方便用户选择报修位置。\n\n建筑类型枚举：dormitory-宿舍楼（学生住宿），administrative-行政楼（办公、会议）\n房间类型枚举：classroom-教室（上课用），meeting-会议室（会议用），laboratory-实验室（实验用），dormitory-宿舍（住宿用）\n运动类型枚举：basketball-篮球场，football-足球场，swimming-游泳池，gym-健身房，tennis-网球场，volleyball-排球场\n是否可对外使用：true-可预约，false-不可预约',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        buildings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', description: '建筑ID' },
              buildingName: { type: 'string', description: '建筑名称' },
              buildingType: {
                type: 'string',
                enum: ['dormitory', 'administrative'],
                description: '建筑类型枚举：dormitory-宿舍楼（学生住宿），administrative-行政楼（办公、会议）',
              },
              address: { type: 'string', description: '建筑地址' },
              rooms: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', description: '房间ID' },
                    roomName: { type: 'string', description: '房间名称' },
                    roomType: {
                      type: 'string',
                      enum: ['classroom', 'meeting', 'laboratory', 'dormitory'],
                      description: '房间类型枚举：classroom-教室（上课用），meeting-会议室（会议用），laboratory-实验室（实验用），dormitory-宿舍（住宿用）',
                    },
                    floorNo: { type: 'number', description: '楼层号' },
                    capacity: { type: 'number', description: '座位数/床位数量' },
                    examCapacity: { type: 'number', description: '考试座位数' },
                    isPublic: { type: 'boolean', description: '是否可对外使用（true-可预约，false-不可预约）' },
                  },
                },
              },
            },
          },
        },
        sportsFacilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', description: '设施ID' },
              facilityName: { type: 'string', description: '设施名称' },
              sportType: {
                type: 'string',
                enum: ['basketball', 'football', 'swimming', 'gym', 'tennis', 'volleyball'],
                description: '运动类型枚举：basketball-篮球场，football-足球场，swimming-游泳池，gym-健身房，tennis-网球场，volleyball-排球场',
              },
              location: { type: 'string', description: '地理位置' },
              capacity: { type: 'number', description: '容纳人数' },
              openingHours: { type: 'string', description: '开放时间' },
              isPublic: { type: 'boolean', description: '是否可对外使用（true-可预约，false-不可预约）' },
            },
          },
        },
      },
    },
  })
  async getCampusStructure() {
    return this.campusService.getCampusStructure()
  }
}
