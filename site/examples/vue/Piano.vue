<script setup lang="ts">
import * as Tone from 'tone'
import { onBeforeUnmount } from 'vue'

import { SHORTCUTS } from '@tremolo-ui/dom'
import { noteName, noteNumber } from '@tremolo-ui/functions'
import { Piano } from '@tremolo-ui/vue'

// Copy this file from the Styling page into your own project.
import pianoTheme from './Piano.module.css'

const synth = new Tone.PolySynth({ volume: -6 }).toDestination()
onBeforeUnmount(() => {
  synth.releaseAll()
  synth.dispose()
})
</script>

<template>
  <Piano
    :class="pianoTheme.root"
    :classes="{
      keyLabelWrapper: pianoTheme.keyLabelWrapper,
      keyLabel: pianoTheme.keyLabel,
    }"
    :key-props="
      (_note, { keyType }) => ({
        class: keyType === 'white' ? pianoTheme.whiteKey : pianoTheme.blackKey,
      })
    "
    :note-range="{ first: noteNumber('C3'), last: noteNumber('B4') }"
    :keyboard-shortcuts="SHORTCUTS.HOME_ROW"
    @play-note="(note) => synth.triggerAttack(noteName(note))"
    @stop-note="(note) => synth.triggerRelease(noteName(note))"
  >
    <template #label="{ state }">
      {{ SHORTCUTS.HOME_ROW.keys[state.index]?.toUpperCase() }}
    </template>
  </Piano>
</template>
