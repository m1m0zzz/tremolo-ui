import {
  computed,
  defineComponent,
  h,
  ref,
  watch,
  type HTMLAttributes,
  type PropType,
  type SlotsType,
} from 'vue'

import {
  blackKeyWidth,
  createPianoInput,
  fitWhiteKeyWidth,
  getNoteRangeArray,
  notePosition,
  pianoWidth,
  type KeyboardShortcuts,
  type KeyboardShortcutsScope,
  type NoteRange,
  type PianoInputInstance,
  type PianoLayout,
} from '@tremolo-ui/dom'
import { isWhiteKey, noteKey } from '@tremolo-ui/functions'

/** What a key is, when the `label` slot or `keyProps` is asked about it. */
export interface KeyState {
  /** Position in the note range, counting from `noteRange.first`. */
  index: number
  keyType: 'white' | 'black'
  /** Whether the note is currently sounding. */
  active: boolean
  /** Whether the note is above `midiMax` and cannot sound. */
  disabled: boolean
}

/** What `keyProps` may return for one key. */
export type KeyAttributes = HTMLAttributes &
  Record<`data-${string}`, string | number | boolean | undefined>

/**
 * Customizable piano. The keys are drawn by the component; what goes inside
 * one is the `label` slot, which receives the note and its state.
 */
export const Piano = /* @__PURE__ */ defineComponent({
  name: 'Piano',
  props: {
    /** The notes drawn, from `first` to `last`. */
    noteRange: { type: Object as PropType<NoteRange>, required: true },
    /** Let a pointer slide from one key to the next. @default true */
    glissando: { type: Boolean, default: true },
    /** Highest note that can sound. @default 127 */
    midiMax: { type: Number, default: 127 },
    /** Play notes from the computer keyboard. See `SHORTCUTS` in `@tremolo-ui/dom`. */
    keyboardShortcuts: Object as PropType<KeyboardShortcuts>,
    /** Where keyboard shortcuts listen. @default 'root' */
    keyboardShortcutsScope: {
      type: String as PropType<KeyboardShortcutsScope>,
      default: 'root',
    },
    /** Follow the width of the parent element. */
    resizable: Boolean,
    /** Width of a white key in pixels. @default 40 */
    whiteKeyWidth: { type: Number, default: 40 },
    /** Space between two white keys, in pixels. @default 1 */
    keyGap: { type: Number, default: 1 },
    /** Width of a black key, as a fraction of a white one. @default 0.65 */
    blackKeyWidthRatio: { type: Number, default: 0.65 },
    /** Height of a black key, as a fraction of the keyboard. @default 0.6 */
    blackKeyHeightRatio: { type: Number, default: 0.6 },
    /** Classes for the label inside each key. */
    classes: Object as PropType<{
      keyLabelWrapper?: string
      keyLabel?: string
    }>,
    /**
     * Extra attributes for one key, by note. The geometry of the key is
     * applied after the returned style and cannot be overridden.
     */
    keyProps: Function as PropType<
      (note: number, state: KeyState) => KeyAttributes
    >,
  },
  emits: {
    /** A note started sounding. */
    playNote: (note: number, _velocity?: number) => typeof note === 'number',
    /** Everything holding a note let go of it. */
    stopNote: (note: number) => typeof note === 'number',
  },
  slots: Object as SlotsType<{
    label: { note: number; state: KeyState }
  }>,
  setup(props, { slots, emit, expose }) {
    const root = ref<HTMLDivElement | null>(null)
    const activeNotes = ref<number[]>([])
    /** Set while `resizable` is on, measured from the parent. */
    const resizedKeyWidth = ref<number | null>(null)

    const notes = computed(() => getNoteRangeArray(props.noteRange))
    const layout = computed((): PianoLayout => ({
      noteRange: props.noteRange,
      whiteKeyWidth: props.resizable
        ? (resizedKeyWidth.value ?? props.whiteKeyWidth)
        : props.whiteKeyWidth,
      keyGap: props.keyGap,
      blackKeyWidthRatio: props.blackKeyWidthRatio,
      blackKeyHeightRatio: props.blackKeyHeightRatio,
    }))
    const settings = () => ({
      layout: layout.value,
      glissando: props.glissando,
      midiMax: props.midiMax,
      keyboardShortcuts: props.keyboardShortcuts,
      keyboardShortcutsScope: props.keyboardShortcutsScope,
    })

    let instance: PianoInputInstance | null = null

    // Only the element decides how the instance is wired. Everything else is
    // pushed with update(), so that changing the layout mid-drag — the parent
    // being resized under `resizable`, say — does not abort the drag.
    watch(
      root,
      (element, _, onCleanup) => {
        if (!element) return
        const current = createPianoInput(element, {
          ...settings(),
          onPlayNote: (note, velocity) => emit('playNote', note, velocity),
          onStopNote: (note) => emit('stopNote', note),
          onActiveNotesChange: (next) => {
            activeNotes.value = next
          },
        })
        instance = current
        onCleanup(() => {
          instance = null
          current.destroy()
        })
      },
      { immediate: true, flush: 'post' },
    )
    watch(settings, (next) => instance?.update(next))

    watch(
      () =>
        [
          root.value,
          props.resizable,
          props.noteRange.first,
          props.noteRange.last,
          props.keyGap,
        ] as const,
      ([element, resizable, first, last, keyGap], _, onCleanup) => {
        if (!resizable || !element) return
        const parent = element.parentElement
        if (!parent) throw new Error("doesn't have a parent element.")
        const observer = new ResizeObserver(() => {
          resizedKeyWidth.value = fitWhiteKeyWidth(
            element.clientWidth,
            { first, last },
            keyGap,
          )
        })
        observer.observe(parent)
        onCleanup(() => observer.disconnect())
      },
      { immediate: true, flush: 'post' },
    )

    expose({
      /** Start a note, as a key would. */
      playNote: (note: number, velocity?: number) =>
        instance?.noteOn(note, { source: 'api', velocity }),
      /** Release a note started with `playNote`. */
      stopNote: (note: number) => instance?.noteOff(note, { source: 'api' }),
    })

    // The group can own keyboard shortcuts and must receive focus. The width
    // is computed from the layout rather than chosen, so it stays inline.
    return () =>
      h(
        'div',
        {
          ref: root,
          role: 'group',
          tabindex: 0,
          'data-resizable': props.resizable ? '' : undefined,
          style: {
            position: 'relative',
            width: props.resizable ? '100%' : `${pianoWidth(layout.value)}px`,
          },
        },
        notes.value.map((note, index) => {
          const state: KeyState = {
            index,
            keyType: isWhiteKey(note) ? 'white' : 'black',
            active: activeNotes.value.includes(note),
            disabled: note > props.midiMax,
          }
          const { style: keyStyle, ...attributes } =
            props.keyProps?.(note, state) ?? {}
          const white = state.keyType === 'white'
          const label = slots.label?.({ note, state })
          // Placed and sized from the layout; the black keys sit over the
          // white ones whichever order they are drawn in. The geometry comes
          // after the caller's style.
          return h(
            'div',
            {
              key: note,
              'data-note': note,
              'data-note-key': noteKey(note),
              'data-active': state.active ? '' : undefined,
              'data-disabled': state.disabled ? '' : undefined,
              ...attributes,
              style: [
                { position: 'absolute', zIndex: white ? 1 : 2 },
                keyStyle,
                {
                  left: `${notePosition(note, layout.value)}px`,
                  width: `${white ? layout.value.whiteKeyWidth : blackKeyWidth(layout.value)}px`,
                  height: white
                    ? '100%'
                    : `${props.blackKeyHeightRatio * 100}%`,
                },
              ],
            },
            label
              ? h('div', { class: props.classes?.keyLabelWrapper }, [
                  h('div', { class: props.classes?.keyLabel }, label),
                ])
              : undefined,
          )
        }),
      )
  },
})
