/**
 * Exclusive or, with `undefined` read as `false`.
 *
 * A control whose orientation and direction are separate props is flipped by
 * either one of them, and put back by both together. Writing that as
 * `a !== b` reads as a comparison, and breaks as soon as one of the two is
 * `undefined` because a prop was left out.
 */
export function xor(a = false, b = false) {
  return (a || b) && a !== b
}
