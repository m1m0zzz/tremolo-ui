import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import { createPianoInput, type PianoInputInstance } from '@tremolo-ui/dom'
import {
  blackKeyWidth,
  getNoteRangeArray,
  isWhiteKey,
  noteKey,
  notePosition,
  pianoWidth,
  type NoteRange,
  type PianoLayout,
} from '@tremolo-ui/functions'

import { useEventListener } from '../../hooks/useEventListener'
import { cssLength } from '../_util/css-length'

import { KeyboardShortcuts } from './keyboard-shortcuts'

type KeyboardShortcutsScope = 'root' | 'window'

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.matches('input, textarea, select')) return true

  for (let element: HTMLElement | null = target; element;) {
    const contentEditable = element.getAttribute('contenteditable')
    if (contentEditable !== null)
      return contentEditable.toLowerCase() !== 'false'
    element = element.parentElement
  }

  return false
}

function shortcutKey(event: KeyboardEvent) {
  return event.code || event.key
}

/**
 * `style` that also takes CSS custom properties, which is how a key's colours
 * are set: see `index.css` for the ones each key type reads.
 */
export type CSSVariables = Record<`--${string}`, string | number | undefined>

/**
 * What {@link PianoProps.keyProps} may return for one key.
 *
 * `data-*` attributes are spelled out because TypeScript only allows them on
 * JSX syntax, not on an object type, and selecting on one is the usual way to
 * mark a key out.
 */
export type KeyAttributes = Omit<ComponentPropsWithoutRef<'div'>, 'style'> & {
  style?: CSSProperties & CSSVariables
} & Record<`data-${string}`, string | number | boolean | undefined>

/** What a key is, when {@link PianoProps.label} or `keyProps` is asked about it. */
export interface KeyState {
  /** Position in the note range, counting from `noteRange.first`. */
  index: number
  keyType: 'white' | 'black'
  /** Whether the note is currently sounding. */
  active: boolean
  /** Whether the note is above {@link PianoProps.midiMax} and cannot sound. */
  disabled: boolean
}

export interface PianoProps {
  /**
   * Classes for what a key draws inside itself: `keyLabelWrapper`, and
   * `keyLabel` around what `label` returns. The key itself takes a class
   * through `keyProps`, which is also where the note and its state are.
   */
  classes?: {
    keyLabelWrapper?: string
    keyLabel?: string
  }

  /**
   * The notes to draw keys for, as MIDI note numbers from `first` to `last`,
   * both included.
   */
  noteRange: NoteRange

  /**
   * Let a pointer slide from one key to the next while it is down. With it
   * off, the key that was pressed sounds until the pointer is released.
   *
   * @default true
   */
  glissando?: boolean

  /**
   * Highest note that can sound. Keys above it carry `data-disabled`.
   *
   * @default 127
   */
  midiMax?: number

  /**
   * Play notes from the computer keyboard: `keys[i]` plays
   * `noteRange.first + i`. `SHORTCUTS` has ready-made layouts, which assume
   * `noteRange.first` is a C. Where they listen is `keyboardShortcutsScope`.
   */
  keyboardShortcuts?: KeyboardShortcuts

  /**
   * Where keyboard shortcuts listen. `root` handles keys only while the Piano
   * root or one of its descendants has focus; `window` handles them anywhere
   * on the page except in editable elements.
   *
   * @default 'root'
   */
  keyboardShortcutsScope?: KeyboardShortcutsScope

  /**
   * Follow the width of the parent element, deriving the width of a white key
   * from it. {@link PianoProps.whiteKeyWidth} is ignored.
   *
   * @default false
   */
  resizable?: boolean

  /**
   * Width of a white key in pixels, not counting `keyGap`. Ignored while
   * `resizable` is on.
   * @default 40
   */
  whiteKeyWidth?: number
  /**
   * Space between two white keys, in pixels.
   * @default 1
   */
  keyGap?: number
  /**
   * Width of a black key, as a fraction of {@link PianoProps.whiteKeyWidth}.
   * @default 0.65
   */
  blackKeyWidthRatio?: number
  /**
   * Height of a black key, as a fraction of the height of the keyboard.
   * @default 0.6
   */
  blackKeyHeightRatio?: number

  /**
   * Height of the keyboard. Sets `--height`; when it is omitted, the height
   * the theme gives stands, and the theme can tell `resizable` apart through
   * `data-resizable`.
   */
  height?: number | string

  style?: CSSProperties & CSSVariables

  /**
   * What to draw inside a key. `''`, `null` and `undefined` leave it bare, so
   * a layout with gaps — {@link SHORTCUTS.HOME_ROW_NATURAL}, say — needs no
   * special casing.
   */
  label?: (note: number, state: KeyState) => ReactNode

  /**
   * Extra props for one key, by note: a class, a style, a `data-*` attribute
   * to select on.
   *
   * The geometry of the key (`left`, `width`, `height`) is applied after the
   * returned `style` and cannot be overridden, so a key cannot be drawn
   * somewhere other than where it responds.
   *
   * @example highlight the notes of a scale
   * ```tsx
   * keyProps={(note) => ({ 'data-in-scale': inScale(note, root, 'major') ? '' : undefined })}
   * ```
   */
  keyProps?: (note: number, state: KeyState) => KeyAttributes

  /**
   * Called when a note starts sounding, whether a pointer, a keyboard shortcut
   * or `playNote` asked for it. A note held by several of them at once is
   * reported once. `velocity` is what `playNote` was given, and `undefined`
   * otherwise.
   */
  onPlayNote?: (note: number, velocity?: number) => void
  /** Called once everything holding a note has let go of it. */
  onStopNote?: (note: number) => void
}

export interface PianoMethods {
  playNote: (note: number, velocity?: number) => void
  stopNote: (note: number) => void
}

type Props = PianoProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PianoProps>

export const Root = /* @__PURE__ */ forwardRef<PianoMethods, Props>(
  function Root(
    {
      noteRange,
      glissando = true,
      midiMax = 127,
      keyboardShortcuts,
      keyboardShortcutsScope = 'root',
      resizable = false,
      whiteKeyWidth = 40,
      keyGap = 1,
      blackKeyWidthRatio = 0.65,
      blackKeyHeightRatio = 0.6,
      height,
      style,
      className,
      label,
      keyProps,
      classes,
      onPlayNote,
      onStopNote,
      ...props
    },
    forwardedRef,
  ) {
    // See useDrag for why the node is held in state rather than a ref: an inline
    // ref would be re-attached on every render and tear the instance down.
    const [node, setNode] = useState<HTMLDivElement | null>(null)
    const [activeNotes, setActiveNotes] = useState<number[]>([])
    /** Set while `resizable` is on, measured from the parent. */
    const [resizedKeyWidth, setResizedKeyWidth] = useState(whiteKeyWidth)

    const notes = useMemo(() => getNoteRangeArray(noteRange), [noteRange])
    const whiteKeyCount = useMemo(
      () => notes.filter(isWhiteKey).length,
      [notes],
    )

    const layout: PianoLayout = useMemo(
      () => ({
        noteRange,
        whiteKeyWidth: resizable ? resizedKeyWidth : whiteKeyWidth,
        keyGap,
        blackKeyWidthRatio,
        blackKeyHeightRatio,
      }),
      [
        noteRange,
        resizable,
        resizedKeyWidth,
        whiteKeyWidth,
        keyGap,
        blackKeyWidthRatio,
        blackKeyHeightRatio,
      ],
    )

    // Read when the instance is created. The effect below keeps it current, and
    // runs right after, so a stale handler is replaced within the same commit.
    const latest = useRef({
      layout,
      glissando,
      midiMax,
      onPlayNote,
      onStopNote,
    })
    const instanceRef = useRef<PianoInputInstance | null>(null)
    const shortcutNotes = useRef(
      new Map<string, { note: number; source: string }>(),
    )

    const releaseShortcutNotes = useCallback(() => {
      for (const { note, source } of shortcutNotes.current.values()) {
        instanceRef.current?.noteOff(note, { source })
      }
      shortcutNotes.current.clear()
    }, [])

    useEffect(() => {
      if (!node) return

      const instance = createPianoInput(node, {
        layout: latest.current.layout,
        glissando: latest.current.glissando,
        midiMax: latest.current.midiMax,
        onPlayNote: (note, velocity) =>
          latest.current.onPlayNote?.(note, velocity),
        onStopNote: (note) => latest.current.onStopNote?.(note),
        onActiveNotesChange: setActiveNotes,
      })
      instanceRef.current = instance

      return () => {
        instanceRef.current = null
        instance.destroy()
      }
      // Only the element decides how the instance is wired. Everything else is
      // pushed with update() below, so that changing the layout mid-drag — the
      // parent being resized under `resizable`, say — does not abort the drag.
    }, [node])

    // Runs after every render.
    useEffect(() => {
      latest.current = { layout, glissando, midiMax, onPlayNote, onStopNote }
      instanceRef.current?.update({ layout, glissando, midiMax })
    })

    useEffect(() => {
      if (!resizable || !node) return
      const parent = node.parentElement
      if (!parent) throw new Error("doesn't have a parent element.")

      const resizeObserver = new ResizeObserver(() => {
        setResizedKeyWidth(
          node.clientWidth / Math.max(whiteKeyCount, 1) - keyGap,
        )
      })
      resizeObserver.observe(parent)
      return () => resizeObserver.disconnect()
    }, [resizable, node, whiteKeyCount, keyGap])

    const shortcutKeys = keyboardShortcuts?.keys
    const hasShortcuts = shortcutKeys !== undefined
    // What the held keys were started against, as a value rather than the
    // identity of the array: a caller who writes the keys inline hands over a
    // new array on every render, and releasing on that would stop a note as
    // soon as anything else re-renders — including the state change that
    // playing the note caused.
    const shortcutMapping = shortcutKeys?.join('\u0000')

    useEffect(
      () => releaseShortcutNotes,
      [
        releaseShortcutNotes,
        shortcutMapping,
        keyboardShortcutsScope,
        noteRange.first,
        noteRange.last,
      ],
    )

    /** The note a shortcut key plays, or null when it has none. */
    function shortcutNote(key: string) {
      if (!shortcutKeys || key === '') return null
      const index = shortcutKeys.indexOf(key)
      const note = noteRange.first + index
      return index === -1 || note > noteRange.last ? null : note
    }

    const shortcutTarget = useMemo(
      () => () => {
        if (!hasShortcuts) return null
        return keyboardShortcutsScope === 'window' ? globalThis.window : node
      },
      [hasShortcuts, keyboardShortcutsScope, node],
    )

    const focusOutTarget = useMemo(
      () => () =>
        hasShortcuts && keyboardShortcutsScope === 'root' ? node : null,
      [hasShortcuts, keyboardShortcutsScope, node],
    )

    const windowBlurTarget = useMemo(
      () => () => (hasShortcuts ? globalThis.window : null),
      [hasShortcuts],
    )

    useEventListener(shortcutTarget, 'keydown', (e) => {
      const key = shortcutKey(e)
      if (e.repeat || shortcutNotes.current.has(key)) return
      if (isEditableTarget(e.target)) return

      const note = shortcutNote(e.key)
      if (note === null) return

      const source = `keyboard:${key}`
      shortcutNotes.current.set(key, { note, source })
      instanceRef.current?.noteOn(note, { source })
    })

    useEventListener(shortcutTarget, 'keyup', (e) => {
      const key = shortcutKey(e)
      const shortcut = shortcutNotes.current.get(key)
      if (!shortcut) return

      shortcutNotes.current.delete(key)
      instanceRef.current?.noteOff(shortcut.note, { source: shortcut.source })
    })

    useEventListener(focusOutTarget, 'focusout', (e) => {
      if (e.relatedTarget instanceof Node && node?.contains(e.relatedTarget))
        return
      releaseShortcutNotes()
    })

    useEventListener(windowBlurTarget, 'blur', releaseShortcutNotes)

    useImperativeHandle(
      forwardedRef,
      () => ({
        playNote: (note, velocity) =>
          instanceRef.current?.noteOn(note, { source: 'api', velocity }),
        stopNote: (note) =>
          instanceRef.current?.noteOff(note, { source: 'api' }),
      }),
      [],
    )

    return (
      <div
        ref={setNode}
        className={className}
        data-resizable={resizable ? '' : undefined}
        role="group"
        // The group can own keyboard shortcuts and must receive focus.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        style={
          {
            // Computed from the layout rather than chosen, so it stays inline.
            width: resizable ? '100%' : pianoWidth(layout),
            '--height': cssLength(height),
            // The keys inside are placed against this box.
            position: 'relative',
            ...style,
          } as CSSProperties
        }
        {...props}
      >
        {notes.map((note, index) => {
          const keyType = isWhiteKey(note) ? 'white' : 'black'
          const state: KeyState = {
            index,
            keyType,
            active: activeNotes.includes(note),
            disabled: note > midiMax,
          }

          const {
            className: keyClassName,
            style: keyStyle,
            ...rest
          } = keyProps?.(note, state) ?? {}

          const content = label?.(note, state)

          return (
            <div
              key={note}
              className={keyClassName}
              data-note={note}
              data-note-key={noteKey(note)}
              data-active={state.active ? '' : undefined}
              data-disabled={state.disabled ? '' : undefined}
              {...rest}
              style={{
                // The key is placed and sized from the layout below, which
                // needs it out of flow; the black keys sit over the white
                // ones whichever order they are drawn in.
                position: 'absolute',
                zIndex: keyType === 'white' ? 1 : 2,
                ...keyStyle,
                left: notePosition(note, layout),
                width:
                  keyType === 'white'
                    ? layout.whiteKeyWidth
                    : blackKeyWidth(layout),
                height:
                  keyType === 'white'
                    ? '100%'
                    : `${blackKeyHeightRatio * 100}%`,
              }}
            >
              {content !== '' && content !== null && content !== undefined && (
                <div className={classes?.keyLabelWrapper}>
                  <div className={classes?.keyLabel}>{content}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  },
)

/**
 * Customizable piano component.
 */
export const Piano = { Root }

export { type KeyboardShortcuts, SHORTCUTS } from './keyboard-shortcuts'
