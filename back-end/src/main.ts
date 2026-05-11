import type { ConfigKeyPaths } from './config'
import cluster from 'node:cluster'
import path from 'node:path'
import {
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { useContainer } from 'class-validator'
import express from 'express'

import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { mw as requestIpMw } from 'request-ip'
import { AppModule } from './app.module'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { appRegToken } from './config/app.config'
import { isDev, isMainProcess } from './global/env'
import { setupSwagger } from './setup-swagger'
import { LoggerService } from './shared/logger/logger.service'

declare const module: any

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  })

  const configService = app.get(ConfigService<ConfigKeyPaths>)

  // 更健壮的配置读取方式
  const appConfig = configService.get(appRegToken) || {}
  const port = appConfig?.port || process.env.PORT || 3000
  const globalPrefix = appConfig?.globalPrefix || process.env.GLOBAL_PREFIX || 'api'

  // 设置访问频率限制
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000, // 限制15分钟内最多只能访问1000次
    }),
  )

  // 启用安全头
  app.use(helmet({
    crossOriginResourcePolicy: false, // 允许跨域访问静态资源
    hsts: false,
  }))

  // 获取真实 IP
  app.use(requestIpMw({ attributeName: 'ip' }))

  // Express 中间件
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // class-validator 的 DTO 类中注入 nest 容器的依赖 (用于自定义验证器)
  useContainer(app.select(AppModule), { fallbackOnErrors: true })

  app.enableCors({ origin: '*', credentials: true })
  app.setGlobalPrefix(globalPrefix)

  // 静态文件服务
  app.use('/public', express.static(path.join(__dirname, '..', 'public')))

  // Starts listening for shutdown hooks
  !isDev && app.enableShutdownHooks()

  if (isDev) {
    app.useGlobalInterceptors(new LoggingInterceptor())
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      stopAtFirstError: true,
      enableDebugMessages: isDev,
      disableErrorMessages: !isDev,
      forbidUnknownValues: false,
      exceptionFactory: errors =>
        new UnprocessableEntityException(
          errors.map((e) => {
            const rule = Object.keys(e.constraints!)[0]
            const msg = e.constraints![rule]
            return msg
          })[0],
        ),
    }),
  )

  setupSwagger(app, configService)

  // 设置日志级别为debug
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose'])

  await app.listen(port, '0.0.0.0', async () => {
    app.useLogger(app.get(LoggerService))
    const url = await app.getUrl()
    const { pid } = process
    const env = cluster.isPrimary
    const prefix = env ? 'P' : 'W'

    if (!isMainProcess)
      return

    const logger = new Logger('NestApplication')
    logger.log(`[${prefix + pid}] Server running on ${url}`)
    logger.log(`[${prefix + pid}] API 文档: ${url}/api-docs`)
  })

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}

bootstrap()
