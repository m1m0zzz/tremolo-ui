<script lang="ts">
  import { FileInput } from '../../../src/index.js'

  import type { FileInputProps } from '../../../src/index.js'

  let props: Omit<FileInputProps, 'children'> = $props()
</script>

<FileInput.Root {...props} data-testid="root">
  <FileInput.Trigger>Open a sample</FileInput.Trigger>
</FileInput.Root>
