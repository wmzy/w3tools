export type ErrorCode =
  | 'EXPLORER_MISSING_INVALID_API_KEY'
  | 'EXPLORER_UNKNOWN_ERROR';

export function throwWith(
  e: Error,
  meta: { cause?: unknown; code?: ErrorCode }
) {
  Object.assign(e, meta);
  throw e;
}
