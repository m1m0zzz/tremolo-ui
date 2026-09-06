/** A class name, or the absence of one. */
export type ClassName = string | false | null | undefined

/**
 * Join class names, dropping the ones that are not there.
 *
 * This replaces `clsx`, which was a runtime dependency of the package for a
 * single call shape: **every call is a constant `tremolo-` name plus whatever
 * the caller passed.** Objects, arrays and nesting — the reasons to take the
 * dependency — are used nowhere here.
 */
export function cx(...names: ClassName[]): string {
  return names.filter(Boolean).join(' ')
}
