import { render } from '@testing-library/vue'
import {
  defineComponent,
  h,
  nextTick,
  ref,
  type Component,
  type Ref,
} from 'vue'

import type { Mock } from 'vitest'

/**
 * Render a component with `v-model` wired to a ref, and wait for the drag and
 * the wheel, which attach once the element is mounted.
 */
export async function renderWithModel<T>(
  component: Component,
  initial: T,
  props: Record<string, unknown>,
  children: () => unknown,
): Promise<{
  view: ReturnType<typeof render>
  onChange: Mock
  model: Ref<T>
}> {
  const onChange = vi.fn()
  const model = ref(initial) as Ref<T>
  const Subject = defineComponent({
    setup: () => () =>
      h(
        component,
        {
          ...props,
          modelValue: model.value,
          'onUpdate:modelValue': (v: T) => {
            model.value = v
            onChange(v)
          },
        },
        children,
      ),
  })
  const view = render(Subject)
  await nextTick()
  return { view, onChange, model }
}
