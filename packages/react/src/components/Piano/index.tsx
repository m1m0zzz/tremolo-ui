import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
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

import { KeyboardShortcuts } from './keyboardShortcuts'

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
  noteRange: NoteRange

  /**
   * Let a pointer slide from one key to the next while it is down.
   *
   * @default true
   */
  glissando?: boolean

  /**
   * Highest note that can sound. Keys above it are drawn `aria-disabled`.
   *
   * @default 127
   */
  midiMax?: number

  keyboardShortcuts?: KeyboardShortcuts

  /**
   * Fill the parent element, deriving the width of a white key from it.
   * {@link PianoProps.whiteKeyWidth} is ignored.
   *
   * @default false
   */
  fill?: boolean

  /** @default 40 */
  whiteKeyWidth?: number
  /**
   * Space between two white keys.
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

  /** @default `fill ? '100%' : 160` */
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
   * keyProps={(note) => ({ 'data-in-scale': inScale(note, root, 'major') })}
   * ```
   */
  keyProps?: (note: number, state: KeyState) => KeyAttributes

  onPlayNote?: (note: number, velocity?: number) => void
  onStopNote?: (note: number) => void
}

export interface PianoMethods {
  playNote: (note: number, velocity?: number) => void
  stopNote: (note: number) => void
}

type Props = PianoProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PianoProps>

export const Root = forwardRef<PianoMethods, Props>(function Root(
  {
    noteRange,
    glissando = true,
    midiMax = 127,
    keyboardShortcuts,
    fill = false,
    whiteKeyWidth = 40,
    keyGap = 1,
    blackKeyWidthRatio = 0.65,
    blackKeyHeightRatio = 0.6,
    height = fill ? '100%' : 160,
    style,
    className,
    label,
    keyProps,
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
  /** Set while `fill` is on, measured from the parent. */
  const [filledKeyWidth, setFilledKeyWidth] = useState(whiteKeyWidth)

  const notes = useMemo(() => getNoteRangeArray(noteRange), [noteRange])
  const whiteKeyCount = useMemo(() => notes.filter(isWhiteKey).length, [notes])

  const layout: PianoLayout = useMemo(
    () => ({
      noteRange,
      whiteKeyWidth: fill ? filledKeyWidth : whiteKeyWidth,
      keyGap,
      blackKeyWidthRatio,
      blackKeyHeightRatio,
    }),
    [
      noteRange,
      fill,
      filledKeyWidth,
      whiteKeyWidth,
      keyGap,
      blackKeyWidthRatio,
      blackKeyHeightRatio,
    ],
  )

  // Read when the instance is created. The effect below keeps it current, and
  // runs right after, so a stale handler is replaced within the same commit.
  const latest = useRef({ layout, glissando, midiMax, onPlayNote, onStopNote })
  const instanceRef = useRef<PianoInputInstance | null>(null)

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
    // parent being resized under `fill`, say — does not abort the drag.
  }, [node])

  // Runs after every render.
  useEffect(() => {
    latest.current = { layout, glissando, midiMax, onPlayNote, onStopNote }
    instanceRef.current?.update({ layout, glissando, midiMax })
  })

  useEffect(() => {
    if (!fill || !node) return
    const parent = node.parentElement
    if (!parent) throw new Error("doesn't have a parent element.")

    const resizeObserver = new ResizeObserver(() => {
      setFilledKeyWidth(node.clientWidth / whiteKeyCount - keyGap)
    })
    resizeObserver.observe(parent)
    return () => resizeObserver.disconnect()
  }, [fill, node, whiteKeyCount, keyGap])

  /** The note a shortcut key plays, or null when it has none. */
  function shortcutNote(key: string) {
    if (!keyboardShortcuts || key === '') return null
    const index = keyboardShortcuts.keys.indexOf(key)
    return index === -1 ? null : noteRange.first + index
  }

  useEventListener(globalThis.window, 'keydown', (e) => {
    if (e.repeat) return
    const note = shortcutNote(e.key)
    if (note !== null) instanceRef.current?.noteOn(note, { source: 'keyboard' })
  })

  useEventListener(globalThis.window, 'keyup', (e) => {
    const note = shortcutNote(e.key)
    if (note !== null)
      instanceRef.current?.noteOff(note, { source: 'keyboard' })
  })

  useImperativeHandle(
    forwardedRef,
    () => ({
      playNote: (note, velocity) =>
        instanceRef.current?.noteOn(note, { source: 'api', velocity }),
      stopNote: (note) => instanceRef.current?.noteOff(note, { source: 'api' }),
    }),
    [],
  )

  return (
    <div
      ref={setNode}
      className={clsx('tremolo-piano', className)}
      style={{
        width: fill ? '100%' : pianoWidth(layout),
        height,
        ...style,
      }}
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
            className={clsx(`tremolo-piano-${keyType}-key`, keyClassName)}
            data-note={note}
            data-note-key={noteKey(note)}
            data-active={state.active}
            aria-disabled={state.disabled}
            {...rest}
            style={{
              ...keyStyle,
              left: notePosition(note, layout),
              width:
                keyType === 'white'
                  ? layout.whiteKeyWidth
                  : blackKeyWidth(layout),
              height:
                keyType === 'white' ? '100%' : `${blackKeyHeightRatio * 100}%`,
            }}
          >
            {content !== '' && content !== null && content !== undefined && (
              <div className="tremolo-piano-key-label-wrapper">
                <div className="tremolo-piano-key-label">{content}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

/**
 * Customizable piano component.
 */
export const Piano = { Root }

export { type KeyboardShortcuts, SHORTCUTS } from './keyboardShortcuts'
