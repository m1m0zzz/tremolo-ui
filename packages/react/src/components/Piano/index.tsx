import clsx from 'clsx'
import React, {
  ComponentPropsWithoutRef,
  createRef,
  CSSProperties,
  ReactElement,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  isBlackKey,
  isWhiteKey,
  noteKey,
  NoteKey,
  noteKeys,
} from '@tremolo-ui/functions'

import { useDragWithElement } from '../../hooks/useDragWithElement'
import { useEventListener } from '../../hooks/useEventListener'

import { NoteRange, PianoProvider } from './context'
import {
  BlackKey,
  defaultBlackKeyWidth,
  defaultWhiteKeyWidth,
  KeyMethods,
  WhiteKey,
} from './key'
import { KeyboardShortcuts } from './keyboardShortcuts'

/**
 * Piano component
 *
 * TODO:
 * - add scale highlight
 */

/** @category Piano */
export function getNoteRangeArray(noteRange: NoteRange) {
  return Array.from(
    { length: noteRange.last - noteRange.first + 1 },
    (_, i) => i + noteRange.first,
  )
}

/** @category Piano */
export interface PianoProps {
  // required
  noteRange: NoteRange

  // optional
  glissando?: boolean
  midiMax?: number
  keyboardShortcuts?: KeyboardShortcuts
  fill?: boolean
  whiteNoteWidth?: number
  blackNoteWidth?: number
  height?: number | string

  style?: CSSProperties

  onPlayNote?: (noteNumber: number) => void
  onStopNote?: (noteNumber: number) => void

  label?: (note: number, index: number) => ReactNode

  /**
   * \<WhiteKey /> | \<BlackKey />
   */
  children?: ReactElement | ReactElement[]
}

const blackPerWhiteWidth = defaultBlackKeyWidth / defaultWhiteKeyWidth // 0.65

/**
 * Customizable piano component.
 * @category Piano
 */
export function Piano({
  noteRange,
  glissando = true,
  midiMax = 127,
  keyboardShortcuts,
  fill = false,
  height = fill ? '100%' : 160,
  whiteNoteWidth: _whiteNoteWidth = defaultWhiteKeyWidth,
  style,
  className,
  onPlayNote,
  onStopNote,
  label,
  children,
  onPointerDown,
  ...props
}: PianoProps & Omit<ComponentPropsWithoutRef<'div'>, keyof PianoProps>) {
  // -- state and ref ---
  const [whiteNoteWidth, setWhiteNoteWidth] = useState(_whiteNoteWidth)
  const keyRefs = useRef<RefObject<KeyMethods | null>[]>([])
  for (let i = 0; i < noteRange.last - noteRange.first + 1; i++) {
    keyRefs.current[i] = createRef<KeyMethods>()
  }
  const pianoRef = useRef<HTMLDivElement>(null)
  const hitKeyIndex = useRef(-1)

  // --- interpret props ---
  const noteRangeArray = getNoteRangeArray(noteRange)
  const whiteNotes = noteRangeArray.filter((v) => isWhiteKey(v))
  const blackNotes = noteRangeArray.filter((v) => isBlackKey(v))
  const whiteNoteCount = whiteNotes.length
  const padding = 1
  const staticWidth = (whiteNoteWidth + padding) * whiteNoteCount
  // const blackNoteShiftPercent = 0.3

  const childrenWithProps = useMemo(() => {
    return (
      children &&
      React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const __width =
            child.type == WhiteKey ? whiteNoteWidth : whiteNoteWidth * 0.65
          const props = { ref: keyRefs.current[index], __width }
          return React.cloneElement(child, props)
        }
        return child
      })
    )
  }, [children, whiteNoteWidth])

  // --- internal functions ---
  const notePosition = useCallback(
    (note: number) => {
      const pitchPositions: Record<NoteKey, number> = {
        C: 0,
        'C#': 1,
        D: 1,
        'D#': 2,
        E: 2,
        F: 3,
        'F#': 4,
        G: 4,
        'G#': 5,
        A: 5,
        'A#': 6,
        B: 6,
      }

      const blackNoteWidth = whiteNoteWidth * blackPerWhiteWidth
      const padding = 1
      const targetNoteKey = noteKey(note)
      const firstNoteKey = noteKey(noteRange.first)
      const octave = Math.floor((note - noteRange.first) / 12)
      const octaveOffset =
        noteKeys.indexOf(firstNoteKey) > noteKeys.indexOf(targetNoteKey) ? 1 : 0
      const w = whiteNoteWidth + padding
      const pos = pitchPositions[targetNoteKey] - pitchPositions[firstNoteKey]
      const blackKeyOffset = isBlackKey(note) ? blackNoteWidth / 2 : 0
      return pos * w + (octave + octaveOffset) * 7 * w - blackKeyOffset
    },
    [noteRange.first, whiteNoteWidth],
  )

  const getHitKeyIndex = useCallback(
    (x: number, y: number) => {
      if (!pianoRef.current) return -1
      const containerHeight = pianoRef.current.clientHeight
      const notes = [...blackNotes, ...whiteNotes]
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i]
        const pos = notePosition(note)
        const w = isWhiteKey(note)
          ? whiteNoteWidth
          : whiteNoteWidth * blackPerWhiteWidth
        const h = isWhiteKey(note) ? containerHeight : containerHeight * 0.6
        if (pos <= x && x < pos + w && 0 <= y && y < h) {
          return note
        }
      }
      return -1
    },
    [blackNotes, notePosition, whiteNoteWidth, whiteNotes],
  )

  // TODO: 単一のポインターに対しては、useDragで対応可能だが、
  // マルチタッチに対しては、TouchEventを使う必要がありそう
  // 取り敢えず、シングルタッチだけ対応
  const onDrag = useCallback(
    (perX: number, perY: number) => {
      if (!pianoRef.current) return
      const x = perX * staticWidth
      const y = perY * pianoRef.current.clientHeight
      const note = getHitKeyIndex(x, y)
      const index = noteRangeArray.indexOf(note)
      if (index == -1) return
      if (hitKeyIndex.current != index) {
        keyRefs.current[hitKeyIndex.current]?.current?.stop()
        keyRefs.current[index]?.current?.play()
        hitKeyIndex.current = index
      }
    },
    [getHitKeyIndex, noteRangeArray, staticWidth],
  )

  const onDragEnd = useCallback(() => {
    if (keyRefs.current[hitKeyIndex.current]?.current?.played()) {
      keyRefs.current[hitKeyIndex.current]?.current?.stop()
    }
    hitKeyIndex.current = -1
  }, [keyRefs])

  // --- hooks ---
  useEffect(() => {
    if (fill && pianoRef.current) {
      const parent = pianoRef.current.parentElement
      if (!parent) throw new Error("doesn't have a parent element.")
      const resizeObserver = new ResizeObserver(() => {
        const w = pianoRef.current!.clientWidth
        setWhiteNoteWidth(w / whiteNoteCount - padding)
      })
      resizeObserver.observe(parent)
      return () => {
        resizeObserver.unobserve(parent)
      }
    } else {
      setWhiteNoteWidth(_whiteNoteWidth)
    }
  }, [fill, _whiteNoteWidth, whiteNoteCount])

  const [touchMoveRefCallback, pointerDownHandler] =
    useDragWithElement<HTMLDivElement>({
      baseElementRef: pianoRef,
      onDrag: onDrag,
      onDragEnd: onDragEnd,
    })

  useEventListener(globalThis.window, 'keydown', (e) => {
    if (e.repeat) return
    if (!keyboardShortcuts) return
    const index = keyboardShortcuts.keys.indexOf(e.key)
    if (index != -1) {
      if (!keyRefs.current[index]?.current?.played()) {
        keyRefs.current[index]?.current?.play()
      }
    }
  })

  useEventListener(globalThis.window, 'keyup', (e) => {
    if (e.repeat) return
    if (!keyboardShortcuts) return
    const index = keyboardShortcuts.keys.indexOf(e.key)
    if (index != -1) {
      keyRefs.current[index]?.current?.stop()
    }
  })

  return (
    <PianoProvider
      notePosition={notePosition}
      noteRange={noteRange}
      glissando={glissando}
      midiMax={midiMax}
      fill={fill}
      onPlayNote={onPlayNote}
      onStopNote={onStopNote}
      label={label}
    >
      <div
        ref={(div) => {
          pianoRef.current = div
          touchMoveRefCallback(div)
        }}
        className={clsx('tremolo-piano', className)}
        style={{
          width: fill ? '100%' : staticWidth,
          height: height,
          ...style,
        }}
        onPointerDown={(event) => {
          pointerDownHandler(event)
          onPointerDown?.(event)
        }}
        {...props}
      >
        {childrenWithProps ||
          noteRangeArray.map((note, index) =>
            isWhiteKey(note) ? (
              <WhiteKey
                ref={keyRefs.current[index]}
                key={note}
                noteNumber={note}
                __width={whiteNoteWidth}
              />
            ) : (
              <BlackKey
                ref={keyRefs.current[index]}
                key={note}
                noteNumber={note}
                __width={whiteNoteWidth * blackPerWhiteWidth}
              />
            ),
          )}
      </div>
    </PianoProvider>
  )
}

export * from './keyboardShortcuts'

export { WhiteKey, BlackKey, type KeyProps, type KeyMethods } from './key'
export { KeyLabel, type KeyLabelProps } from './KeyLabel'
