import { computed, defineComponent, h, inject, provide, ref, watch } from 'vue'

import { createStepperDrag, type StepperDragInstance } from '@tremolo-ui/dom'

import {
  NumberInputGestureKey,
  StepperKey,
  useNumberInputContext,
} from './context'

/**
 * The area the steppers sit in, and a drag handle in its own right: dragging
 * it up and down moves the value one `step` every `drag` pixels.
 */
export const NumberInputStepper = /* @__PURE__ */ defineComponent({
  name: 'NumberInputStepper',
  setup(_, { slots }) {
    const field = useNumberInputContext()
    const gesture = inject(NumberInputGestureKey, null)
    const el = ref<HTMLDivElement | null>(null)
    let instance: StepperDragInstance | null = null

    // Only attached while it can do something: `createDrag` puts
    // `touch-action: none` on the element, and a stepper that cannot be
    // dragged should not stop the page scrolling under a finger.
    const enabled = computed(
      () => field.drag !== null && !field.disabled && !field.readonly,
    )
    const options = () => ({
      range: field.rawRange,
      pixels: field.drag ?? 1,
      sensitivity: field.dragSensitivity,
      pointerLock: field.pointerLock,
      cursor: field.dragCursor,
    })

    watch(
      [el, enabled],
      ([element, on], _, onCleanup) => {
        if (!element || !on) return
        const current = createStepperDrag(element, {
          ...options(),
          getValue: () => field.value,
          onChange: (next) => field.changeValue(next),
        })
        instance = current
        onCleanup(() => {
          current.destroy()
          if (instance === current) instance = null
        })
      },
      { immediate: true, flush: 'post' },
    )
    watch(options, (next) => instance?.update(next))

    provide(StepperKey, { moved: () => instance?.moved() ?? false })

    return () =>
      h(
        'div',
        {
          ref: el,
          // A drag on the stepper is a press like any other: held from here
          // until the pointer is released.
          onPointerdown: () => {
            if (enabled.value) gesture?.press()
          },
        },
        slots.default?.(),
      )
  },
})
