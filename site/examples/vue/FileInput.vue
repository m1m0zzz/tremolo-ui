<script setup lang="ts">
import { ref } from 'vue'

import { FileInput, FileInputTrigger } from '@tremolo-ui/vue'

// Copy this file from the Styling page into your own project.
import fileInputTheme from './FileInput.module.css'

const files = ref<File[]>([])
const rejected = ref<File[]>([])

function onChange(picked: File[]) {
  rejected.value = []
  files.value = picked
}
</script>

<template>
  <FileInput
    :class="fileInputTheme.root"
    accept="audio/*"
    multiple
    @change="onChange"
    @reject="(picked) => (rejected = picked)"
  >
    <FileInputTrigger :class="fileInputTheme.trigger">
      Choose audio
    </FileInputTrigger>
    <span>{{ files.length > 0 ? `${files.length} selected` : 'No file' }}</span>
  </FileInput>
  <ul>
    <li v-for="file in files" :key="file.name">
      {{ file.name }} ({{ file.type || 'unknown type' }})
    </li>
  </ul>
  <p v-if="rejected.length > 0">
    Not audio: {{ rejected.map((file) => file.name).join(', ') }}
  </p>
</template>
