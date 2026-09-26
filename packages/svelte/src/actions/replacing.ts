/**
 * The update that leaves an instance with exactly `next` as its options.
 *
 * The core's `update()` merges into what it has, which suits a wrapper that
 * pushes one setting at a time. An action is handed the whole new argument
 * instead, so a setting it no longer carries — a handler taken away, an
 * option left to its default — has to be cleared explicitly, or the old one
 * keeps working.
 */
export function replacing<T extends object>(
  previous: T | undefined,
  next: T | undefined,
): Partial<T> {
  const cleared = Object.fromEntries(
    Object.keys(previous ?? {}).map((key) => [key, undefined]),
  ) as Partial<T>
  return { ...cleared, ...next }
}
