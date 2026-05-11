import { Body, Controller, Get, Post, Request } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ApiSecurityAuth } from '../../common/decorators/swagger.decorator'
import { AuthService } from './auth.service'
import { Public } from './decorators/public.decorator'
import { LoginDto, LoginResponseDto, RegisterDto, UserInfoDto } from './dto/auth.dto'

@ApiTags('用户认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({
    summary: '用户注册',
    description: '用户注册接口，支持学生和管理员两种用户类型。注册成功后返回用户信息。\n\n用户类型枚举：student-学生（普通用户，可以预约和报修），admin-管理员（可以审核预约和处理报修）',
  })
  @ApiResponse({ status: 201, description: '注册成功', type: UserInfoDto })
  @ApiResponse({ status: 409, description: '用户名已存在' })
  async register(@Body() registerDto: RegisterDto): Promise<UserInfoDto> {
    return this.authService.register(registerDto)
  }

  @Post('login')
  @Public()
  @ApiOperation({
    summary: '用户登录',
    description: '用户登录接口，验证用户名和密码。登录成功后返回访问令牌和用户信息。\n\n用户类型枚举：student-学生（普通用户，可以预约和报修），admin-管理员（可以审核预约和处理报修）',
  })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto)
  }

  @Get('profile')
  @ApiSecurityAuth()
  @ApiOperation({
    summary: '获取用户信息',
    description: '获取当前登录用户的详细信息，包括用户ID、用户名、用户类型等。\n\n用户类型枚举：student-学生（普通用户，可以预约和报修），admin-管理员（可以审核预约和处理报修）',
  })
  @ApiResponse({ status: 200, description: '获取成功', type: UserInfoDto })
  @ApiResponse({ status: 401, description: '未授权' })
  async getProfile(@Request() req): Promise<UserInfoDto> {
    return this.authService.getUserInfo(req.user.id)
  }
}
