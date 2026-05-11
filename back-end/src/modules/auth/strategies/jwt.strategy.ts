import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from '../auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    })
  }

  async validate(payload: any) {
    console.log('🔍 JwtStrategy - validate called')
    console.log('📦 Payload received:', payload)

    const user = {
      id: payload.sub,
      username: payload.username,
      type: payload.type,
    }

    console.log('👤 Returning user:', user)
    return user
  }

  // 添加自定义的token提取方法用于调试
  authenticate(req: any, options?: any) {
    console.log('🔍 JwtStrategy - authenticate called')
    console.log('📋 Full request headers:', req.headers)
    console.log('🔑 Authorization header:', req.headers.authorization)
    console.log('🔑 Authorization header type:', typeof req.headers.authorization)
    console.log('🔑 Authorization header length:', req.headers.authorization?.length)

    return super.authenticate(req, options)
  }
}
