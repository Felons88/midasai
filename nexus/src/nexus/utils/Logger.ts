// src/nexus/utils/Logger.ts
import { ILogger } from '../interfaces/ILogger';

export class Logger implements ILogger {
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  debug(message: string): void {
    console.debug(`[DEBUG] ${message}`);
  }

  error(message: string, context?: Error): void {
    console.error(`[ERROR] ${message}`, context);
  }
}