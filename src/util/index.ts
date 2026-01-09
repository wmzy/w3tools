import { getAddress } from "viem";

export function sleep(ms: number, signal?: AbortSignal) {
  if (!signal) {
    return new Promise<void>((resolve) => void setTimeout(resolve, ms));
  }

  if (signal.aborted) return Promise.resolve();

  const { promise, resolve } = Promise.withResolvers<void>();

  const timeout = setTimeout(resolve, ms);
  signal.addEventListener('abort', resolve as any);

  return promise.finally(() => {
    signal.removeEventListener('abort', resolve as any);
    clearTimeout(timeout);
  });
}

export function retry<T>(
  task: () => Promise<T>,
  retries: number,
  beforeRetry: (retries: number, error: any) => Promise<any>
): Promise<T> {
  return task().catch((e) => {
    if (retries > 0) {
      return beforeRetry(retries, e).then(() =>
        retry(task, retries - 1, beforeRetry)
      );
    }
    throw e;
  });
}

export function tryParseJSON<T>(json: any): T | undefined;
export function tryParseJSON<T>(json: any, defaultValue: T): T;
export function tryParseJSON<T>(json: any, defaultValue?: T): T | undefined {
  if (!json) {
    return defaultValue;
  }
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    return defaultValue;
  }
}

export function toAddress(address: string) {
  try {
    return getAddress(address);
  } catch {
    return address;
  }
}

export function rangeMap<T>(length: number, map: (i: number) => T) {
  return Array.from({ length }, (_, i) => map(i));
}

export function range(start: number, end: number) {
  return rangeMap(end - start + 1, (i) => start + i);
}

export function camelCase(str: string) {
  // 先转换为小写并去除首尾空格
  const trimmed = str.trim().toLowerCase();
  return str
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+([a-z0-9])/g, (_, char) => char.toUpperCase())
    .replace(/[-_\s]+/g, '');
}
