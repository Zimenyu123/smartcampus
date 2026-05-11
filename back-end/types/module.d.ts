import 'fastify'

declare module 'fastify' {
  interface FastifyRequest { // 接口
    user?: IAuthUser // request中的用户
    accessToken: string // token?
  }
}

declare module 'nestjs-cls' {
  interface ClsStore {
    /** 当前请求操作的 ID */
    operateId: number
  }
}
