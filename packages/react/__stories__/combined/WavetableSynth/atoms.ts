import { atom } from 'jotai'

export const MIN_POSITION = 0
export const MAX_POSITION = 100
export const MIN_ATTACK = 1
export const MAX_ATTACK = 1000
export const MIN_DECAY = 10
export const MAX_DECAY = 1000
export const MIN_SUSTAIN = 0
export const MAX_SUSTAIN = 100
export const MIN_RELEASE = 10
export const MAX_RELEASE = 1000

export const positionAtom = atom(0)
export const attackAtom = atom(10)
export const decayAtom = atom(200)
export const sustainAtom = atom(50)
export const releaseAtom = atom(200)

export interface KeyState {
  trigger: 'pressed' | 'release'
  timestamp?: number
}
