import { resolve } from 'node:path'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'mysql',
          host: configService.get('DB_HOST', 'localhost'),
          port: Number.parseInt(configService.get('DB_PORT', '3306')),
          username: configService.get('DB_USERNAME', 'root'),
          password: configService.get('DB_PASSWORD', ''),
          database: configService.get('DB_DATABASE', 'auth_db'),
          entities: [resolve(__dirname, '../../**/*.entity{.ts,.js}')],
          synchronize: configService.get('DB_SYNCHRONIZE', true),
          logging: configService.get('DB_LOGGING', ['error']),
          charset: 'utf8mb4',
        }
      },
    }),
  ],
})
export class DatabaseModule {}
