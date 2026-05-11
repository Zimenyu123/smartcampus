import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * 业务异常类
 * 用于处理业务逻辑中的错误，比如权限不足、资源不存在等
 */
export class BusinessException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status)
  }
}
