export type ExcludeLast<T extends readonly any[]> = T extends readonly [
  ...infer Head,
  any
]
  ? Head
  : never;

export type Tail<T extends any[]> = ((...t: T) => void) extends (
  x: any,
  ...u: infer U
) => void
  ? U
  : never;
