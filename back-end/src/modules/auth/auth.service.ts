import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { LoginDto, LoginResponseDto, RegisterDto, UserInfoDto } from './dto/auth.dto'
import { UserEntity, UserType } from './user.entity'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<UserInfoDto> {
    const { username, password, type = UserType.STUDENT } = registerDto

    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username },
    })

    if (existingUser) {
      throw new ConflictException('用户名已存在')
    }

    // 加密密码
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // 创建新用户
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      type,
    })

    const savedUser = await this.userRepository.save(user)

    // 返回用户信息（不包含密码）
    return {
      id: savedUser.id,
      username: savedUser.username,
      type: savedUser.type,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    }
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto

    // 查找用户
    const user = await this.userRepository.findOne({
      where: { username },
    })

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    // 生成 JWT token
    const payload = {
      sub: user.id,
      username: user.username,
      type: user.type,
    }
    const accessToken = this.jwtService.sign(payload)

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        type: user.type,
      },
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: number): Promise<UserInfoDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new BadRequestException('用户不存在')
    }

    return {
      id: user.id,
      username: user.username,
      type: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  /**
   * 验证用户
   */
  async validateUser(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    return user
  }
}
