import type { AllowAsync } from './spec';

/**
 * Ensures the result is a promise.
 * @param result
 * @returns
 */
export async function ensureAsync<T>(result: AllowAsync<T>): Promise<T> {
  return result instanceof Promise ? await result : result;
}
