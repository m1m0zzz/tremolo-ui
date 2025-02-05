type Operator = '+' | '-' | '*' | '/'

/**
 * @category Utility
 */
export function styleHelper(value: string | number): string
export function styleHelper(
  value: string | number,
  op: Operator,
  influencer?: number,
): string
export function styleHelper(
  value: string | number,
  op?: Operator,
  influencer?: number,
) {
  if (op && influencer) {
    if (typeof value == 'number') {
      if (op == '+') return `${value + influencer}px`
      if (op == '-') return `${value - influencer}px`
      if (op == '*') return `${value * influencer}px`
      if (op == '/') return `${value / influencer}px`
    } else {
      return `calc(${value}px ${op} ${influencer})`
    }
  } else {
    if (typeof value == 'number') {
      return `${value}px`
    } else {
      return value
    }
  }
}

/**
 * @category Utility
 */
export function isEmpty(obj: object) {
  return Object.keys(obj).length == 0
}

/**
 * @category Utility
 */
export function mod(n: number, m: number) {
  return (((n % m) + m) % m)
}

/**
 * @category Utility
 */
export function xor(a = false, b = false) {
  return ((a || b) && (a != b))
}
