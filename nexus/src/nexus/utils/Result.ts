// src/nexus/utils/Result.ts
export class Result<T, E> {
  constructor(
    public value: T | null,
    public error: E | null,
    public success: boolean
  ) {}

  static success<T>(value: T): Result<T, any> {
    return new Result<T, any>(value, null, true);
  }

  static failure<E, T>(error: E): Result<T, E> {
    return new Result<T, E>(null, error, false);
  }
}