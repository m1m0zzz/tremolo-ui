<script lang="ts">
  import { dropZone } from '../../actions/drop-zone.js'

  import type { DropZoneProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = DropZoneProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof DropZoneProps>

  let {
    accept,
    multiple = false,
    disabled = false,
    onDrop,
    onReject,
    ref = $bindable(null),
    children,
    ...rest
  }: Props = $props()

  let over = $state(false)
  let invalid = $state(false)

  const options = $derived({
    accept,
    multiple,
    disabled,
    onDrop: (files: File[], event: DragEvent) => onDrop?.(files, event),
    onReject: (files: File[], event: DragEvent) => onReject?.(files, event),
    onStateChange: (state: { over: boolean; invalid: boolean }) => {
      over = state.over
      invalid = state.invalid
    },
  })
</script>

<div
  bind:this={ref}
  data-dragover={over ? '' : undefined}
  data-invalid={invalid ? '' : undefined}
  data-disabled={disabled ? '' : undefined}
  use:dropZone={options}
  {...rest}
>
  {@render children()}
</div>
