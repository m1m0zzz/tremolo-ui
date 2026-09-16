import type { CSSProperties } from 'react'

/**
 * CSS custom properties, for a `style` object.
 *
 * React's `CSSProperties` has no key starting with `--`, so
 * `style={{ '--color': 'red' }}` is refused as an unknown property even though
 * the browser takes it. Every part accepts this alongside `CSSProperties`,
 * which is how a variable the component or a theme reads is set inline.
 *
 * `T` names the custom properties the part itself writes or reads, so that an
 * editor can suggest them. Any other `--` name is still accepted — a theme
 * reads variables of its own, such as the colours of each kind of key.
 *
 * @example
 * CSSVariables<'--thickness' | '--length'>
 * // { '--thickness'?: string | number, '--length'?: string | number,
 * //   [name: `--${string}`]: string | number | undefined }
 */
export type CSSVariables<T extends `--${string}` = never> = {
  [K in T]?: string | number
} & {
  [K in `--${string}`]?: string | number
}

/**
 * The attributes `P` with a `style` that also takes custom properties, `T`
 * being the ones the part writes or reads.
 *
 * @internal
 */
export type WithCSSVariables<P, T extends `--${string}` = never> = Omit<
  P,
  'style'
> & {
  style?: CSSProperties & CSSVariables<T>
}
