<script setup lang="ts">
import { ref } from 'vue'

import { DropZone } from '@tremolo-ui/vue'

// Copy this file from the Styling page into your own project.
import dropZoneTheme from './DropZone.module.css'

const files = ref<File[]>([])
const rejected = ref<File[]>([])

function onDrop(dropped: File[]) {
  rejected.value = []
  files.value = dropped
}
</script>

<template>
  <DropZone
    :class="dropZoneTheme.root"
    accept="audio/*"
    multiple
    @drop="onDrop"
    @reject="(dropped) => (rejected = dropped)"
  >
    Drop an audio file here
  </DropZone>
  <ul>
    <li v-for="(file, i) in files" :key="i">
      {{ file.name }} ({{ file.type || 'unknown type' }})
    </li>
  </ul>
  <p v-if="rejected.length > 0">
    Not audio: {{ rejected.map((file) => file.name).join(', ') }}
  </p>
</template>
