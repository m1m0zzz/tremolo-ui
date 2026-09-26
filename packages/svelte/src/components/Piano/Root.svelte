<script lang="ts">
  import {
    blackKeyWidth,
    createPianoInput,
    fitWhiteKeyWidth,
    getNoteRangeArray,
    notePosition,
    pianoWidth,
    type PianoInputInstance,
    type PianoLayout,
  } from '@tremolo-ui/dom'
  import { isWhiteKey, noteKey } from '@tremolo-ui/functions'
  import { untrack } from 'svelte'

  import type { KeyState, PianoProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = PianoProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof PianoProps>

  let {
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
    classes,
    label,
    keyProps,
    onPlayNote,
    onStopNote,
    ref = $bindable(null),
    style,
    ...rest
  }: Props = $props()

  let activeNotes: number[] = $state([])
  /** Set while `resizable` is on, measured from the parent. */
  let resizedKeyWidth: number | null = $state(null)

  const notes = $derived(getNoteRangeArray(noteRange))
  const layout: PianoLayout = $derived({
    noteRange,
    whiteKeyWidth: resizable
      ? (resizedKeyWidth ?? whiteKeyWidth)
      : whiteKeyWidth,
    keyGap,
    blackKeyWidthRatio,
    blackKeyHeightRatio,
  })

  let instance: PianoInputInstance | null = null

  // Only the element decides how the instance is wired. Everything else is
  // pushed with update() below, so that changing the layout mid-drag — the
  // parent being resized under `resizable`, say — does not abort the drag.
  $effect(() => {
    if (!ref) return
    const current = createPianoInput(
      ref,
      untrack(() => ({
        layout,
        glissando,
        midiMax,
        keyboardShortcuts,
        keyboardShortcutsScope,
        onPlayNote: (note, velocity) => onPlayNote?.(note, velocity),
        onStopNote: (note) => onStopNote?.(note),
        onActiveNotesChange: (next) => {
          activeNotes = next
        },
      })),
    )
    instance = current
    return () => {
      instance = null
      current.destroy()
    }
  })

  $effect(() => {
    instance?.update({
      layout,
      glissando,
      midiMax,
      keyboardShortcuts,
      keyboardShortcutsScope,
    })
  })

  $effect(() => {
    if (!resizable || !ref) return
    const node = ref
    const parent = node.parentElement
    if (!parent) throw new Error("doesn't have a parent element.")
    const range = { first: noteRange.first, last: noteRange.last }
    const observer = new ResizeObserver(() => {
      resizedKeyWidth = fitWhiteKeyWidth(node.clientWidth, range, keyGap)
    })
    observer.observe(parent)
    return () => observer.disconnect()
  })

  /** Start a note, as a key would. */
  export function playNote(note: number, velocity?: number) {
    instance?.noteOn(note, { source: 'api', velocity })
  }

  /** Release a note started with `playNote`. */
  export function stopNote(note: number) {
    instance?.noteOff(note, { source: 'api' })
  }

  function keyState(note: number, index: number): KeyState {
    return {
      index,
      keyType: isWhiteKey(note) ? 'white' : 'black',
      active: activeNotes.includes(note),
      disabled: note > midiMax,
    }
  }
</script>

<!-- The group can own keyboard shortcuts and must receive focus. The width
  is computed from the layout rather than chosen, so it stays inline. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={ref}
  role="group"
  tabindex="0"
  data-resizable={resizable ? '' : undefined}
  style="position: relative; width: {resizable
    ? '100%'
    : `${pianoWidth(layout)}px`}; {style ?? ''}"
  {...rest}
>
  {#each notes as note, index (note)}
    {@const state = keyState(note, index)}
    {@const { style: keyStyle, ...attributes } = keyProps?.(note, state) ?? {}}
    <!-- Placed and sized from the layout, which needs it out of flow; the
      black keys sit over the white ones whichever order they are drawn in.
      The geometry comes after the caller's style. -->
    <div
      data-note={note}
      data-note-key={noteKey(note)}
      data-active={state.active ? '' : undefined}
      data-disabled={state.disabled ? '' : undefined}
      {...attributes}
      style="position: absolute; z-index: {state.keyType === 'white'
        ? 1
        : 2}; {keyStyle ?? ''}"
      style:left="{notePosition(note, layout)}px"
      style:width="{state.keyType === 'white'
        ? layout.whiteKeyWidth
        : blackKeyWidth(layout)}px"
      style:height={state.keyType === 'white'
        ? '100%'
        : `${blackKeyHeightRatio * 100}%`}
    >
      {#if label}
        <div class={classes?.keyLabelWrapper}>
          <div class={classes?.keyLabel}>{@render label(note, state)}</div>
        </div>
      {/if}
    </div>
  {/each}
</div>
