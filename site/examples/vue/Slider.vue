<script setup lang="ts">
import { ref } from 'vue'

import { Slider, SliderThumb, SliderTrack } from '@tremolo-ui/vue'

// Copy this file from the Styling page into your own project.
import sliderTheme from './Slider.module.css'

const value = ref(64)
</script>

<template>
  <Slider v-model="value" :class="sliderTheme.root" :min="0" :max="100">
    <SliderTrack :class="sliderTheme.track">
      <SliderThumb :class="sliderTheme.thumb" aria-label="Level" />
    </SliderTrack>
  </Slider>
  <span>{{ value }}</span>
</template>
