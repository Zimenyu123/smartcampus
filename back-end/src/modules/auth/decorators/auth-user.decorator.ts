import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

type Payload = keyof any

/**
 * @description 获取当前登录用户信息, 并挂载到request上
 */
export const AuthUser = createParamDecorator(
  (data: Payload, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>()
    // auth guard will mount this
    const user = request.user as any

    return data ? user?.[data] : user
  },
)
