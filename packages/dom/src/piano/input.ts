import { noteAt, type PianoLayout } from '@tremolo-ui/functions'

import { createDrag } from '../pointer/drag'

/**
 * What asked for a note to sound.
 *
 * A note stops only once everything that asked for it has let go, so two
 * fingers on one key, or a key held by both the mouse and a MIDI keyboard,
 * behave the way they look.
 *
 * Pointers use `pointer:<pointerId>`; everything else names its own source.
 */
export type NoteSource = string

export interface PianoInputOptions {
  /** Geometry of the drawn keyboard, used to find the note under a pointer. */
  layout: PianoLayout

  /**
   * Let a pointer slide from one key to the next while it is down. With it off,
   * the key that was pressed keeps sounding until the pointer is released.
   *
   * @default true
   */
  glissando?: boolean

  /**
   * Highest note that can sound. Above it a note is refused, whichever source
   * asks for it.
   *
   * @default 127
   */
  midiMax?: number

  /** Called when a note starts sounding, not for each source that asks. */
  onPlayNote?: (note: number, velocity?: number) => void
  /** Called once the last source holding a note has let go. */
  onStopNote?: (note: number) => void
  /** Called whenever {@link PianoInputInstance.activeNotes} would change. */
  onActiveNotesChange?: (notes: number[]) => void
}

export interface PianoInputInstance {
  /**
   * Replace the given options. Lets a wrapper feed a fresh layout in without
   * tearing down the listeners, which would abort a drag in progress.
   */
  update: (options: Partial<PianoInputOptions>) => void

  /**
   * Start a note from something other than a pointer: a keyboard shortcut, a
   * MIDI message, an imperative call.
   */
  noteOn: (
    note: number,
    options?: { source?: NoteSource; velocity?: number },
  ) => void
  /** Release a note held by `source`. */
  noteOff: (note: number, options?: { source?: NoteSource }) => void

  /** The notes currently sounding, ascending. */
  activeNotes: () => number[]

  destroy: () => void
}

const DEFAULT_SOURCE: NoteSource = 'api'

/**
 * Drive a piano keyboard with pointers, and own what is sounding.
 *
 * Every way of playing a note goes through the one instance — pointers here,
 * keyboard shortcuts and MIDI through {@link PianoInputInstance.noteOn} — so
 * there is a single answer to what is currently held, and drawing the keys is
 * left entirely to the wrapper.
 *
 * Tracks every pointer at once, so a chord can be played with several fingers.
 */
export function createPianoInput(
  element: Element,
  options: PianoInputOptions,
): PianoInputInstance {
  let opts = options

  /** Which sources are holding each sounding note. */
  const held = new Map<number, Set<NoteSource>>()
  /** The note each pointer is currently on. */
  const pointerNotes = new Map<number, number>()

  function activeNotes(): number[] {
    return [...held.keys()].sort((a, b) => a - b)
  }

  function noteOn(
    note: number,
    {
      source = DEFAULT_SOURCE,
      velocity,
    }: { source?: NoteSource; velocity?: number } = {},
  ) {
    if (note > (opts.midiMax ?? 127)) return

    const sources = held.get(note)
    if (sources) {
      // Already sounding: remember the extra holder and leave it alone.
      sources.add(source)
      return
    }

    held.set(note, new Set([source]))
    opts.onPlayNote?.(note, velocity)
    opts.onActiveNotesChange?.(activeNotes())
  }

  function noteOff(
    note: number,
    { source = DEFAULT_SOURCE }: { source?: NoteSource } = {},
  ) {
    const sources = held.get(note)
    if (!sources) return

    sources.delete(source)
    if (sources.size > 0) return

    held.delete(note)
    opts.onStopNote?.(note)
    opts.onActiveNotesChange?.(activeNotes())
  }

  /** The note under a pointer, or null where the pointer is off the keys. */
  function noteUnder(clientX: number, clientY: number): number | null {
    const { left, top, height } = element.getBoundingClientRect()
    return noteAt(clientX - left, clientY - top, height, opts.layout)
  }

  /** Move a pointer onto a note, releasing whatever it held before. */
  function movePointer(pointerId: number, note: number | null) {
    const source = `pointer:${pointerId}`
    const previous = pointerNotes.get(pointerId)
    if (previous === note) return

    if (previous !== undefined) noteOff(previous, { source })

    if (note === null) {
      pointerNotes.delete(pointerId)
    } else {
      pointerNotes.set(pointerId, note)
      noteOn(note, { source })
    }
  }

  const drag = createDrag(element, {
    multiPointer: true,
    onDragStart: (state) =>
      movePointer(state.pointerId, noteUnder(state.clientX, state.clientY)),
    onDrag: (state) => {
      // Without glissando the pressed key holds until the pointer is released,
      // so where the pointer wanders to does not matter.
      if (opts.glissando === false) return
      movePointer(state.pointerId, noteUnder(state.clientX, state.clientY))
    },
    onDragEnd: (state) => movePointer(state.pointerId, null),
  })

  return {
    update: (next) => {
      opts = { ...opts, ...next }
    },
    noteOn,
    noteOff,
    activeNotes,
    destroy: () => {
      drag.destroy()
      // Anything still held is released, so a caller that mirrors these
      // callbacks into a synth is not left with a stuck note.
      for (const note of activeNotes()) {
        held.delete(note)
        opts.onStopNote?.(note)
      }
      pointerNotes.clear()
      opts.onActiveNotesChange?.([])
    },
  }
}
