// src/nexus/interfaces/ILogger.ts
export interface ILogger {
  info(message: string): void;
  debug(message: string): void;
  error(message: string, context?: Error): void;
}