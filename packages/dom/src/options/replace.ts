/**
 * The `update()` argument that leaves an instance with exactly `next` as its
 * options.
 *
 * `update()` merges into what the instance has, which suits a wrapper that
 * pushes one setting at a time. A wrapper handed the whole new set instead —
 * a Svelte action, a Vue composable — has to clear what the new set no longer
 * carries, or a handler taken away, or an option left to its default, keeps
 * working.
 *
 * @example
 * instance.update(replaceOptions(previous, next))
 */
export function replaceOptions<T extends object>(
  previous: T | undefined,
  next: T | undefined,
): Partial<T> {
  const cleared = Object.fromEntries(
    Object.keys(previous ?? {}).map((key) => [key, undefined]),
  ) as Partial<T>
  return { ...cleared, ...next }
}
