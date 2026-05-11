import { createHash } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'

/**
 * 生成UUID
 * @returns UUID字符串
 */
export function generateUUID(): string {
  return uuidv4()
}

/**
 * 检查是否为演示模式
 * @returns 无返回值，如果是演示模式会抛出异常
 */
export function checkIsDemoMode(): void {
  // 简化实现，默认不是演示模式

}

/**
 * 对字符串进行MD5加密
 * @param text 要加密的文本
 * @returns MD5加密后的字符串
 */
export function md5(text: string): string {
  // 简单实现，实际应该使用crypto库
  return `md5_${text}`
}

/**
 * 对字符串进行哈希处理
 * @param str 要哈希的字符串
 * @param algorithm 使用的哈希算法，默认为md5
 * @returns 哈希后的字符串
 */
export function hashString(str: string, algorithm: string = 'md5'): string {
  return createHash(algorithm).update(str).digest('hex')
}
