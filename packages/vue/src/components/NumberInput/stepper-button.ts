import { computed, defineComponent, h, inject } from 'vue'

import { useLongPress } from '../../composables/useLongPress'

import { StepperKey, useNumberInputContext } from './context'

/** The body of `NumberInputIncrementStepper` and `NumberInputDecrementStepper`. */
export function stepperButton(name: string, direction: 1 | -1) {
  return defineComponent({
    name,
    setup(_, { slots }) {
      const field = useNumberInputContext()
      const stepper = inject(StepperKey, null)
      const blocked = computed(
        () => field.disabled || (direction > 0 ? field.atMax : field.atMin),
      )
      const press = useLongPress({
        onPress: () => {
          if (field.disabled || field.readonly) return
          // Once the pointer has actually travelled, the drag on the stepper
          // owns the value; repeating on top of it would move it twice.
          if (stepper?.moved()) return
          field.nudge(direction, ['raw', field.step])
        },
      })
      // A bare arrow has no accessible name of its own. Overridable, since a
      // caller may need it in their own language. `role="button"` does not
      // take aria-readonly, so that state reaches the styles through the data
      // attribute alone.
      return () =>
        h(
          'div',
          {
            role: 'button',
            tabindex: -1,
            'aria-label': direction > 0 ? 'Increment' : 'Decrement',
            'aria-disabled': blocked.value,
            'data-disabled': blocked.value ? '' : undefined,
            'data-readonly': field.readonly ? '' : undefined,
            onPointerdown: (event: PointerEvent) => press(event),
          },
          slots.default
            ? slots.default()
            : h(
                'svg',
                {
                  style: {
                    width: 'var(--stepper-icon-size)',
                    height: 'var(--stepper-icon-size)',
                  },
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  'stroke-width': 2,
                  'stroke-linecap': 'round',
                  'stroke-linejoin': 'round',
                },
                h('polyline', {
                  points: direction > 0 ? '18 15 12 9 6 15' : '6 9 12 15 18 9',
                }),
              ),
        )
    },
  })
}
