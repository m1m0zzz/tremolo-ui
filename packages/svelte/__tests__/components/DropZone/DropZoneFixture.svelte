<script lang="ts">
  import { DropZone } from '../../../src/index.js'

  import type { DropZoneProps } from '../../../src/index.js'

  let props: Omit<DropZoneProps, 'children'> = $props()
</script>

<DropZone.Root {...props} data-testid="zone">Drop here</DropZone.Root>
