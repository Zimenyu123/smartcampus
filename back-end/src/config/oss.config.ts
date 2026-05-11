import { ConfigType, registerAs } from '@nestjs/config'
import { env, envNumber } from '~/global/env'

/**
 * OSS配置注册令牌
 */
export const ossRegToken = 'oss'

/**
 * OSS配置对象
 */
export const OssConfig = registerAs(
  ossRegToken,
  () => ({
    // 基础OSS服务配置
    accessKeyId: env('OSS_ACCESS_KEY_ID', ''),
    accessKeySecret: env('OSS_ACCESS_KEY_SECRET', ''),
    bucket: env('OSS_BUCKET', 'your-bucket-name'),
    region: env('OSS_REGION', 'cn-shenzhen'),
    endpoint: env('OSS_ENDPOINT', ''),

    // 文件管理配置
    fileRetentionDays: envNumber('FILE_RETENTION_DAYS', 30),
    chunkSize: envNumber('FILE_CHUNK_SIZE', 5 * 1024 * 1024),
    userFileLimit: envNumber('USER_FILE_LIMIT', 1000),
    fileMaxSize: envNumber('FILE_MAX_SIZE', 2 * 1024 * 1024 * 1024),
  }),
)

/**
 * OSS配置类型
 */
export type IOssConfig = ConfigType<typeof OssConfig>
