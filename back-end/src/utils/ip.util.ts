import { Request } from 'express'

/**
 * 获取客户端IP地址
 * @param request 请求对象
 * @returns IP地址
 */
export function getIp(request: Request): string {
  return request.ip || request.socket.remoteAddress || 'unknown'
}
