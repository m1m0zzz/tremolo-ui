import { createDrag } from '../pointer/drag'

import { noteAt, type PianoLayout } from './layout'
import {
  isEditableTarget,
  type KeyboardShortcuts,
  type KeyboardShortcutsScope,
} from './shortcuts'

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

  /**
   * Play notes from the computer keyboard: `keys[i]` plays
   * `layout.noteRange.first + i`. `SHORTCUTS` has ready-made layouts.
   *
   * A held key keeps its note until it is released, the focus leaves (with
   * `root`), or the window loses focus. Changing the keys, the scope or the
   * note range releases every note a key is holding, since the key would
   * mean something else on release.
   */
  keyboardShortcuts?: KeyboardShortcuts

  /**
   * Where keyboard shortcuts listen: on the element (`root`), which has to
   * be focusable, or anywhere on the page (`window`). Keys typed into an
   * editable element are ignored either way.
   *
   * @default 'root'
   */
  keyboardShortcutsScope?: KeyboardShortcutsScope

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
   * Start a note from something other than a pointer or a shortcut: a MIDI
   * message, an imperative call.
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
  /**
   * The note each held shortcut key is playing, by `code` — the physical key,
   * so that releasing it with a different modifier or layout still matches.
   */
  const shortcutNotes = new Map<string, number>()

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
    if (!Number.isInteger(note) || note < 0 || note > 127) {
      throw new RangeError('note: requirements: an integer from 0 to 127')
    }
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
    if (!Number.isInteger(note) || note < 0 || note > 127) {
      throw new RangeError('note: requirements: an integer from 0 to 127')
    }
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

    if (note === null || note > (opts.midiMax ?? 127)) {
      pointerNotes.delete(pointerId)
    } else {
      pointerNotes.set(pointerId, note)
      noteOn(note, { source })
    }
  }

  /** The note a shortcut key plays, or null when it has none. */
  function shortcutNote(key: string) {
    const keys = opts.keyboardShortcuts?.keys
    if (!keys || key === '') return null
    const { first, last } = opts.layout.noteRange
    const index = keys.indexOf(key)
    const note = first + index
    return index === -1 || note > last ? null : note
  }

  function onKeyDown(event: KeyboardEvent) {
    const id = event.code || event.key
    if (event.repeat || shortcutNotes.has(id)) return
    if (isEditableTarget(event.target)) return
    const note = shortcutNote(event.key)
    if (note === null) return
    shortcutNotes.set(id, note)
    noteOn(note, { source: `keyboard:${id}` })
  }

  function onKeyUp(event: KeyboardEvent) {
    const id = event.code || event.key
    const note = shortcutNotes.get(id)
    if (note === undefined) return
    shortcutNotes.delete(id)
    noteOff(note, { source: `keyboard:${id}` })
  }

  function releaseShortcuts() {
    for (const [id, note] of shortcutNotes) {
      noteOff(note, { source: `keyboard:${id}` })
    }
    shortcutNotes.clear()
  }

  function onFocusOut(event: Event) {
    const next = (event as FocusEvent).relatedTarget
    // Moving between the keys and whatever else is inside keeps them held.
    if (next instanceof Node && element.contains(next)) return
    releaseShortcuts()
  }

  /** The scope the listeners are bound for, or null when none are. */
  let boundScope: KeyboardShortcutsScope | null = null

  function bindShortcuts() {
    const scope = opts.keyboardShortcuts
      ? (opts.keyboardShortcutsScope ?? 'root')
      : null
    if (scope === boundScope) return
    unbindShortcuts()
    const win = globalThis.window
    if (!scope || !win) return
    const target: EventTarget = scope === 'window' ? win : element
    target.addEventListener('keydown', onKeyDown as EventListener)
    target.addEventListener('keyup', onKeyUp as EventListener)
    if (scope === 'root') element.addEventListener('focusout', onFocusOut)
    // A key released while the window is in the background never sends its
    // keyup, so everything is let go when the focus leaves the page.
    win.addEventListener('blur', releaseShortcuts)
    boundScope = scope
  }

  function unbindShortcuts() {
    const win = globalThis.window
    if (!boundScope || !win) return
    const target: EventTarget = boundScope === 'window' ? win : element
    target.removeEventListener('keydown', onKeyDown as EventListener)
    target.removeEventListener('keyup', onKeyUp as EventListener)
    element.removeEventListener('focusout', onFocusOut)
    win.removeEventListener('blur', releaseShortcuts)
    boundScope = null
  }

  /**
   * What the held keys were started against. Compared by value: a caller
   * who writes the keys inline hands over a new array on every update, and
   * releasing on that would stop a note as soon as anything re-renders.
   */
  function shortcutMapping() {
    const { first, last } = opts.layout.noteRange
    return [
      opts.keyboardShortcuts?.keys.join('\u0000') ?? '',
      opts.keyboardShortcutsScope ?? 'root',
      first,
      last,
    ].join('\u0001')
  }

  bindShortcuts()

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
      const mapping = shortcutMapping()
      opts = { ...opts, ...next }
      if (shortcutMapping() !== mapping) releaseShortcuts()
      bindShortcuts()

      const midiMax = opts.midiMax ?? 127
      const stoppedNotes = activeNotes().filter((note) => note > midiMax)
      if (stoppedNotes.length === 0) return

      for (const note of stoppedNotes) {
        held.delete(note)
        opts.onStopNote?.(note)
      }
      for (const [pointerId, note] of pointerNotes) {
        if (note > midiMax) pointerNotes.delete(pointerId)
      }
      opts.onActiveNotesChange?.(activeNotes())
    },
    noteOn,
    noteOff,
    activeNotes,
    destroy: () => {
      drag.destroy()
      unbindShortcuts()
      shortcutNotes.clear()
      // Anything still held is released, so a caller that mirrors these
      // callbacks into a synth is not left with a stuck note.
      const notes = activeNotes()
      for (const note of notes) {
        held.delete(note)
        opts.onStopNote?.(note)
      }
      pointerNotes.clear()
      if (notes.length > 0) opts.onActiveNotesChange?.([])
    },
  }
}
