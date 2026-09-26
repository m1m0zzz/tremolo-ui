<script setup lang="ts">
import { ref } from 'vue'

import {
  Knob,
  KnobActiveLine,
  KnobInactiveLine,
  KnobSVGRoot,
  KnobThumb,
} from '@tremolo-ui/vue'

// Copy this file from the Styling page into your own project.
import knobTheme from './Knob.module.css'

const value = ref(64)
</script>

<template>
  <Knob
    v-model="value"
    :class="knobTheme.root"
    aria-label="Level"
    :min="0"
    :max="100"
    :size="50"
  >
    <KnobSVGRoot>
      <KnobActiveLine :class="knobTheme.activeLine" />
      <KnobInactiveLine :class="knobTheme.inactiveLine" />
      <KnobThumb
        :class="knobTheme.thumb"
        :classes="{ thumbLine: knobTheme.thumbLine }"
      />
    </KnobSVGRoot>
  </Knob>
  {{ value }}
</template>
