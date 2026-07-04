// src/nexus/interfaces/IConfig.ts
export interface IConfig {
  get(key: string): string | undefined;
  settings?: Record<string, any>;
}