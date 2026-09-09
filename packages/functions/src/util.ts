export function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

export function xor(a = false, b = false) {
  return (a || b) && a !== b
}
