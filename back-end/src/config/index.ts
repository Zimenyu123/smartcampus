import { AppConfig, appRegToken } from './app.config'
import { DatabaseConfig, dbRegToken } from './database.config'
import { OssConfig, ossRegToken } from './oss.config'
import { SecurityConfig, securityRegToken } from './security.config'
import { SwaggerConfig, swaggerRegToken } from './swagger.config'

export {
  AppConfig,
  appRegToken,
  DatabaseConfig,
  dbRegToken,
  OssConfig,
  ossRegToken,
  SecurityConfig,
  securityRegToken,
  SwaggerConfig,
  swaggerRegToken,
}

export interface ConfigKeyPaths {
  [key: string]: any
  [appRegToken]: ReturnType<typeof AppConfig>
  [dbRegToken]: ReturnType<typeof DatabaseConfig>
  [securityRegToken]: ReturnType<typeof SecurityConfig>
  [ossRegToken]: ReturnType<typeof OssConfig>
  [swaggerRegToken]: ReturnType<typeof SwaggerConfig>
}

export type IAppConfig = ConfigKeyPaths[typeof appRegToken]
export type IDatabaseConfig = ConfigKeyPaths[typeof dbRegToken]
export type ISecurityConfig = ConfigKeyPaths[typeof securityRegToken]
export type IOssConfig = ConfigKeyPaths[typeof ossRegToken]
export type ISwaggerConfig = ConfigKeyPaths[typeof swaggerRegToken]

export { RouterWhiteList } from './app.config'

export default [AppConfig, DatabaseConfig, SecurityConfig, OssConfig, SwaggerConfig]
