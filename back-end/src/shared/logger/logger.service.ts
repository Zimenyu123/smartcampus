import { ConsoleLogger, Injectable } from '@nestjs/common'

@Injectable()
export class LoggerService extends ConsoleLogger {
  error(message: any, trace?: string, context?: string): void {
    super.error(message, trace, context)
  }

  warn(message: any, context?: string): void {
    super.warn(message, context)
  }

  log(message: any, context?: string): void {
    super.log(message, context)
  }

  debug(message: any, context?: string): void {
    super.debug(message, context)
  }

  verbose(message: any, context?: string): void {
    super.verbose(message, context)
  }
}
