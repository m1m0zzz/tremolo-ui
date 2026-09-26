<script setup lang="ts">
import { ref } from 'vue'

import type { XY } from '@tremolo-ui/dom'
import { XYPad, XYPadArea, XYPadThumb } from '@tremolo-ui/vue'

// Copy this file from the Styling page into your own project.
import xyPadTheme from './XYPad.module.css'

const value = ref<XY<number>>([32, 56])
</script>

<template>
  <XYPad v-model="value" :class="xyPadTheme.root" :min="0" :max="100">
    <XYPadArea :class="xyPadTheme.area">
      <XYPadThumb
        :class="xyPadTheme.thumb"
        :aria-label="['X position', 'Y position']"
      />
    </XYPadArea>
  </XYPad>
  <p>x: {{ value[0] }}, y: {{ value[1] }}</p>
</template>
