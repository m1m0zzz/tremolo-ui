<script setup lang="ts">
import { reactive } from 'vue'

import type { PointPosition } from '@tremolo-ui/dom'
import {
  PointsEditor,
  PointsEditorBackground,
  PointsEditorContainer,
  PointsEditorPoint,
  PointsEditorSelectionBox,
} from '@tremolo-ui/vue'

// Copy this file from the Styling page into your own project.
import pointsEditorTheme from './PointsEditor.module.css'

const points = reactive<Record<string, PointPosition>>({
  'p-0': { x: 0, y: 0.5 },
  'p-1': { x: 0.35, y: 0.15 },
  'p-2': { x: 0.7, y: 0.85 },
  'p-3': { x: 1, y: 0.5 },
})
</script>

<template>
  <PointsEditor :class="pointsEditorTheme.root" selectable>
    <PointsEditorBackground style="background: #f2f4f5; border-radius: 4px" />
    <PointsEditorContainer>
      <PointsEditorPoint
        v-for="(_, id) in points"
        :id="id"
        :key="id"
        v-model="points[id]"
        :class="pointsEditorTheme.point"
      />
      <PointsEditorSelectionBox :class="pointsEditorTheme.selectionBox" />
    </PointsEditorContainer>
  </PointsEditor>
</template>
