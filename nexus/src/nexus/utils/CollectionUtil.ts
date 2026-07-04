// src/nexus/utils/CollectionUtil.ts
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
}