/** Whether a record has no enumerable own string-keyed properties. */
export function isEmpty(obj: Record<string, unknown>) {
  return Object.keys(obj).length === 0
}

export function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

export function xor(a = false, b = false) {
  return (a || b) && a !== b
}
