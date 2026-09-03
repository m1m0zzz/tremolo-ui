/**
 * A component for `propTypes.test.ts` to read the types of. It lives under a
 * `components` directory because that is where `collectPropTypes` looks.
 */
import type { ReactNode } from 'react'

type Mode = 'a' | 'b'
type Pair<T> = T | readonly [x: T, y: T]

export interface FixtureProps {
  size: number | string
  mode: Mode | null
  pair: Pair<number>
  flag?: boolean
  children?: ReactNode
}

export function Fixture({ children }: FixtureProps) {
  return <>{children}</>
}
