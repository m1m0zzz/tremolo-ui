<script setup lang="ts">
import { ref } from 'vue'

import {
  NumberInput,
  NumberInputDecrementStepper,
  NumberInputField,
  NumberInputIncrementStepper,
  NumberInputStepper,
} from '@tremolo-ui/vue'

// Copy this file from the Styling page into your own project.
import numberInputTheme from './NumberInput.module.css'

const value = ref(64)
</script>

<template>
  <NumberInput
    v-model="value"
    :class="numberInputTheme.root"
    :min="0"
    :max="100"
  >
    <NumberInputField :class="numberInputTheme.field" aria-label="Value" />
    <NumberInputStepper :class="numberInputTheme.stepper">
      <NumberInputIncrementStepper :class="numberInputTheme.incrementStepper" />
      <NumberInputDecrementStepper :class="numberInputTheme.decrementStepper" />
    </NumberInputStepper>
  </NumberInput>
</template>
