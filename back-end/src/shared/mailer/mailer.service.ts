import { Injectable } from '@nestjs/common'
import { LoggerService } from '../logger/logger.service'

@Injectable()
export class MailerService {
  constructor(private logger: LoggerService) {}

  /**
   * 发送邮件（存根实现）
   */
  async sendMail(options: any): Promise<any> {
    this.logger.log(`模拟发送邮件: ${JSON.stringify(options)}`, 'MailerService')
    return { success: true }
  }
}
