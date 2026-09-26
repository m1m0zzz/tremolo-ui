/**
 * What an `accept` rule is matched against.
 *
 * `File` satisfies it, and so does `DataTransferItem` — which matters while a
 * drag is still in the air, since the browser reports the type of what is
 * being dragged but withholds the name.
 */
export interface AcceptCandidate {
  /** The file name, when it is known. */
  name?: string
  /** The MIME type, or `''` when the browser has no type for it. */
  type: string
}

/**
 * Does a file satisfy an `accept` attribute?
 *
 * `accept` is written the way the HTML attribute is: a comma separated list of
 * extensions (`.wav`), MIME types (`audio/wav`) and type groups (`audio/*`).
 * Anything that matches one entry is accepted, and an empty or missing
 * `accept` takes everything.
 *
 * **The browser's own `accept` is only a hint to the file picker.** A person
 * can switch it to "All Files", drag a file in, or pick one the picker was
 * never asked about, so what arrives still has to be checked.
 *
 * A rule that cannot be decided is not treated as a rejection: with no `name`,
 * an extension rule says nothing either way, and `accept=".wav"` reports a
 * match rather than refusing a file it has not seen the name of. The name is
 * there by the time the file is dropped, which is when the answer counts.
 */
export function matchesAccept(
  candidate: AcceptCandidate,
  accept?: string,
): boolean {
  const rules = (accept ?? '')
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
  if (rules.length === 0) return true

  const name = candidate.name?.toLowerCase()
  const type = candidate.type.toLowerCase()
  let undecided = false

  for (const rule of rules) {
    if (rule.startsWith('.')) {
      if (name === undefined) undecided = true
      else if (name.endsWith(rule)) return true
    } else if (rule.endsWith('/*')) {
      if (type.startsWith(rule.slice(0, -1))) return true
    } else if (type === rule) {
      return true
    }
  }

  return undecided
}

/**
 * Split files into those that satisfy `accept` and those that do not, keeping
 * their order. See {@link matchesAccept}.
 */
export function partitionByAccept(
  files: Iterable<File>,
  accept?: string,
): { accepted: File[]; rejected: File[] } {
  const accepted: File[] = []
  const rejected: File[] = []
  for (const file of files) {
    if (matchesAccept(file, accept)) accepted.push(file)
    else rejected.push(file)
  }
  return { accepted, rejected }
}
