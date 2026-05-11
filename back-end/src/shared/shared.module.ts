import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from './logger/logger.module'

@Module({
  imports: [
    // 添加限流模块
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 10,
    }]),
    LoggerModule,
  ],
  exports: [
    ThrottlerModule,
    LoggerModule,
  ],
})
export class SharedModule {}
