<script lang="ts">
  import { AnimationCanvas } from '../../../src/index.js'

  let { onDraw }: { onDraw: (label: string) => void } = $props()
  let label = $state('first')

  export function relabel(next: string) {
    label = next
  }
</script>

<!-- Only `draw` changes with the state: the canvas does not animate. -->
<AnimationCanvas
  animate={false}
  draw={(_, frame) => onDraw(`${label}:${frame.count}`)}
/>
