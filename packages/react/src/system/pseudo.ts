import { CSSObject } from '@emotion/react'

function _toPropName(str: string) {
  return str.replace(/-\w/, (s) => s.toUpperCase()).replace(/^::?/, '_')
}

// ref. https://developer.mozilla.org/ja/docs/Web/CSS/Pseudo-classes

export const inputPseudoSelectors = [
  '&:enabled',
  '&:disabled',
  '&:read-only',
  '&:read-write',
  '&:placeholder-shown',
  '&:blank',
  '&:valid',
  '&:invalid',
  '&:in-range',
  '&:out-of-range',
] as const

export const inputPseudoPropNames = [
  '_enabled',
  '_disabled',
  '_readOnly',
  '_readWrite',
  '_placeholderShown',
  '_blank',
  '_valid',
  '_invalid',
  '_inRange',
  '_outOfRange',
] as const

export type InputPseudos = (typeof inputPseudoPropNames)[number]
export type InputPseudoProps = { [key in InputPseudos]: CSSObject }

export const userActionPseudoSelectors = [
  '&:hover',
  '&:active',
  '&:focus',
] as const

export const userActionPseudoPropNames = [
  '_hover',
  '_active',
  '_focus',
] as const

export type UserActionPseudos = (typeof userActionPseudoPropNames)[number]
export type UserActionPseudoProps = Partial<{
  [key in UserActionPseudos]: CSSObject
}>
