<script lang="ts">
  import { SHORTCUTS } from '@tremolo-ui/dom'
  import { noteName, noteNumber } from '@tremolo-ui/functions'
  import { Piano } from '@tremolo-ui/svelte'
  import * as Tone from 'tone'

  // Copy this file from the Styling page into your own project.
  import pianoTheme from './Piano.module.css'

  let synth: Tone.PolySynth | null = null

  $effect(() => {
    const current = new Tone.PolySynth({ volume: -6 }).toDestination()
    synth = current
    return () => {
      current.releaseAll()
      current.dispose()
      synth = null
    }
  })
</script>

<Piano.Root
  class={pianoTheme.root}
  classes={{
    keyLabelWrapper: pianoTheme.keyLabelWrapper,
    keyLabel: pianoTheme.keyLabel,
  }}
  keyProps={(_note, { keyType }) => ({
    class: keyType === 'white' ? pianoTheme.whiteKey : pianoTheme.blackKey,
  })}
  noteRange={{ first: noteNumber('C3'), last: noteNumber('B4') }}
  keyboardShortcuts={SHORTCUTS.HOME_ROW}
  onPlayNote={(note) => synth?.triggerAttack(noteName(note))}
  onStopNote={(note) => synth?.triggerRelease(noteName(note))}
>
  {#snippet label(_note, { index })}
    {SHORTCUTS.HOME_ROW.keys[index]?.toUpperCase()}
  {/snippet}
</Piano.Root>
