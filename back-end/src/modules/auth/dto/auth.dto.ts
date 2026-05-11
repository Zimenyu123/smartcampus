import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'
import { UserType } from '../user.entity'

/**
 * 用户注册 DTO
 */
export class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'student001' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string

  @ApiPropertyOptional({
    description: '用户类型枚举：student-学生（普通用户，可以预约和报修），admin-管理员（可以审核预约和处理报修）',
    enum: UserType,
    default: UserType.STUDENT,
    example: UserType.STUDENT,
  })
  @IsEnum(UserType)
  @IsOptional()
  type?: UserType = UserType.STUDENT
}

/**
 * 用户登录 DTO
 */
export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'student001' })
  @IsString()
  @IsNotEmpty()
  username: string

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @IsNotEmpty()
  password: string
}

/**
 * 登录响应 DTO
 */
export class LoginResponseDto {
  @ApiProperty({ description: '访问令牌' })
  accessToken: string

  @ApiProperty({ description: '用户信息' })
  user: {
    id: number
    username: string
    type: UserType
  }
}

/**
 * 用户信息响应 DTO
 */
export class UserInfoDto {
  @ApiProperty({ description: '用户ID' })
  id: number

  @ApiProperty({ description: '用户名' })
  username: string

  @ApiProperty({ description: '用户类型枚举：student-学生（普通用户，可以预约和报修），admin-管理员（可以审核预约和处理报修）', enum: UserType })
  type: UserType

  @ApiProperty({ description: '创建时间' })
  createdAt: Date

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date
}

export enum RouterMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export class RouteDto {
  /** 路由 path */
  @ApiProperty({ description: 'api 路径' })
  @IsString({ message: 'path类型错误,正确类型为string' })
  path: string

  /** 路由方法 */
  @ApiProperty({ description: 'api 方法', enum: ['GET', 'POST', 'PUT', 'DELETE'] })
  method: RouterMethods

  /** 路由描述 */
  @ApiProperty({ description: 'api 描述说明', required: false })
  @IsString({ message: 'desc类型错误,正确类型为string' })
  readonly desc?: string
}

export class AuthByOpenidDto {
  @ApiProperty({ description: '用户的OpenID', example: 'openid12345' })
  @IsNotEmpty({ message: 'openid不能为空' })
  @IsString({ message: 'openid必须是字符串' })
  openid: string
}

export class WechatLoginDto {
  @ApiProperty({ description: '微信登录时获取的code', example: '023Hsk0w3hQBMO2cO43w333E0w3Hsk0I' })
  @IsNotEmpty({ message: 'code不能为空' })
  @IsString({ message: 'code必须是字符串' })
  code: string
}

export class SceneDto {
  @ApiProperty({ description: '场景值，用于生成特定的二维码', example: 'login_123456' })
  @IsNotEmpty({ message: 'scene不能为空' })
  @IsString({ message: 'scene必须是字符串' })
  scene: string
}

export class WechatScanDto {
  @ApiProperty({ description: '场景值，需要与生成二维码时一致', example: 'login_123456' })
  @IsNotEmpty({ message: 'scene不能为空' })
  @IsString({ message: 'scene必须是字符串' })
  scene: string
}

export class RefreshTokenDto {
  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
