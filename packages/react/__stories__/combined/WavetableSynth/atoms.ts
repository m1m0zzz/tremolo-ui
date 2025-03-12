import { atom } from 'jotai'

// oscillator
export const MIN_POSITION = 0
export const MAX_POSITION = 100
export const MIN_SEMITONE = -12
export const MAX_SEMITONE = 12
export const MIN_DETUNE = -50
export const MAX_DETUNE = 50

// envelope
export const MIN_ATTACK = 1
export const MAX_ATTACK = 1000
export const MIN_DECAY = 10
export const MAX_DECAY = 1000
export const MIN_SUSTAIN = 0
export const MAX_SUSTAIN = 100
export const MIN_RELEASE = 10
export const MAX_RELEASE = 1000
export const MIN_MASTER_VOLUME = -100
export const MAX_MASTER_VOLUME = 6
export const MIN_VOICE = 1
export const MAX_VOICE = 8
export const MIN_VOICE_DETUNE = 1
export const MAX_VOICE_DETUNE = 100

export const positionAtom = atom(MIN_POSITION)
export const semitoneAtom = atom(0)
export const detuneAtom = atom(0)

export const attackAtom = atom(10)
export const decayAtom = atom(200)
export const sustainAtom = atom(50)
export const releaseAtom = atom(200)
export const masterVolumeAtom = atom(-6)
export const voiceAtom = atom(1)
export const voiceDetuneAtom = atom(15)

export interface KeyState {
  trigger: 'pressed' | 'release'
  timestamp?: number
}
