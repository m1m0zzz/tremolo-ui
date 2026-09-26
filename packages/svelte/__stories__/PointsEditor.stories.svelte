<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'

  import PointsEditorDemo from './PointsEditorDemo.svelte'

  const { Story } = defineMeta({
    title: 'Components/PointsEditor',
    component: PointsEditorDemo,
    args: { selectable: true },
  })
</script>

<Story name="Basic" />
