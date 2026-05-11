import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

const PUBLIC_KEY = '__public_key__'
const ALLOW_ANON = 'allowAnon'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // 检查是否允许匿名访问
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])

    const allowAnon = this.reflector.getAllAndOverride<boolean>(ALLOW_ANON, [
      ctx.getHandler(),
      ctx.getClass(),
    ])

    if (isPublic || allowAnon) {
      console.log('✅ Public endpoint, skipping authentication')
      return true
    }

    const req = ctx.switchToHttp().getRequest()
    const accessToken = req.get('Authorization') // 获取到请求头中的 Authorization 字段

    console.log('🔍 Authorization token:', accessToken)
    console.log('🔍 Token type:', typeof accessToken)

    if (!accessToken) {
      throw new ForbiddenException('请先登录')
    }

    // 使用passport-jwt的验证方式
    return this.activate(ctx)
  }

  async activate(ctx: ExecutionContext): Promise<boolean> {
    return super.canActivate(ctx) as Promise<boolean>
  }
}
