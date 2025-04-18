import { getAddress } from "viem";

export function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();

    const timeout = setTimeout(() => {
      resolve();
    }, ms);

    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timeout);
          resolve();
        },
        { once: true }
      );
    }
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

export function withResolvers<T = void>() {
  let resolve, reject;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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
