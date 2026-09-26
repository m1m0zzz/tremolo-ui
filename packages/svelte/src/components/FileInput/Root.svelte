<script lang="ts">
  import { partitionByAccept } from '@tremolo-ui/dom'

  import { visuallyHidden } from '../_util/style.js'

  import { setFileInputContext } from './context.js'
  import type { FileInputProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = FileInputProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof FileInputProps>

  let {
    accept,
    multiple = false,
    disabled = false,
    onChange,
    onReject,
    ref = $bindable(null),
    children,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    ...rest
  }: Props = $props()

  const inputId = $props.id()

  setFileInputContext({
    inputId,
    get disabled() {
      return disabled
    },
  })

  function handleChange(event: Event & { currentTarget: HTMLInputElement }) {
    const input = event.currentTarget
    const { accepted, rejected } = partitionByAccept(
      Array.from(input.files ?? []),
      accept,
    )
    // Picking the same file twice fires no second change while the value is
    // still on the input, so it is cleared as soon as it is read.
    input.value = ''
    if (rejected.length > 0) onReject?.(rejected)
    if (accepted.length > 0) onChange?.(accepted)
  }
</script>

<!-- The control is the native file input: out of sight but in the tab order,
  with `Trigger` as its label, so the click reaching the picker and the name
  are the browser's job. -->
<div bind:this={ref} data-disabled={disabled ? '' : undefined} {...rest}>
  <input
    id={inputId}
    type="file"
    {accept}
    {multiple}
    {disabled}
    style={visuallyHidden}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
    aria-describedby={ariaDescribedby}
    onchange={handleChange}
  />
  {@render children()}
</div>
