import { defineComponent, h, ref, type Component } from 'vue'

/**
 * A story that holds the value itself, as an app would with `v-model`, and
 * starts from the value in the args.
 */
export function withModel<T>(
  component: Component,
  args: Record<string, unknown> & { modelValue: T },
  children: () => unknown,
) {
  return defineComponent({
    setup() {
      const value = ref(args.modelValue) as { value: T }
      return () =>
        h(
          component,
          {
            ...args,
            modelValue: value.value,
            'onUpdate:modelValue': (v: T) => {
              value.value = v
            },
          },
          children,
        )
    },
  })
}
