<script setup lang="ts">
import * as Tone from 'tone'
import { onBeforeUnmount, onMounted } from 'vue'

import { SHORTCUTS } from '@tremolo-ui/dom'
import { noteName, noteNumber } from '@tremolo-ui/functions'
import { Piano } from '@tremolo-ui/vue'

// Copy this file from the Styling page into your own project.
import pianoTheme from './Piano.module.css'

// Created once mounted: during server rendering there is no Web Audio.
let synth: Tone.PolySynth | null = null
onMounted(() => {
  synth = new Tone.PolySynth({ volume: -6 }).toDestination()
})
onBeforeUnmount(() => {
  synth?.releaseAll()
  synth?.dispose()
  synth = null
})

const play = (note: number) => synth?.triggerAttack(noteName(note))
const stop = (note: number) => synth?.triggerRelease(noteName(note))
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
    @play-note="play"
    @stop-note="stop"
  >
    <template #label="{ state }">
      {{ SHORTCUTS.HOME_ROW.keys[state.index]?.toUpperCase() }}
    </template>
  </Piano>
</template>
