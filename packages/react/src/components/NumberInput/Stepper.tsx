import {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
  Ref,
  useMemo,
  useRef,
} from 'react'

import {
  applyDelta,
  mapModifier,
  selectModifier,
  type InputEventOption,
} from '@tremolo-ui/functions'

import { useDrag } from '../../hooks/useDrag'
import { useComposedRefs } from '../_util/composeRefs'
import { cx } from '../_util/cx'

import { StepperProvider, useNumberInputContext } from './context'

export interface StepperProps {
  className?: string
  style?: CSSProperties
  /** `<NumberInput.IncrementStepper />` and `<NumberInput.DecrementStepper />` go here. */
  children?: ReactNode
  ref?: Ref<HTMLDivElement>
}

/**
 * The area the steppers sit in, and a drag handle in its own right: dragging it
 * up and down moves the value one `step` every `drag` pixels.
 *
 * The drag lives here rather than on `InputField` because `createDrag` turns
 * off text selection on whatever element it is attached to.
 */
export function Stepper({
  className,
  style,
  children,
  ref,
  ...props
}: StepperProps & Omit<ComponentPropsWithoutRef<'div'>, keyof StepperProps>) {
  const { value, step, readonly, drag, dragSensitivity, range, changeValue } =
    useNumberInputContext()

  /**
   * The sensitivity as an amount per `drag` pixels, so that the drag goes
   * through the same `applyDelta` the wheel and the arrow keys do. Carrying
   * the modifier map over rather than resolving it here is what keeps `step`
   * out of the pipeline for a modifier entry — naming one is a request to move
   * off the grid.
   */
  const dragOptions = useMemo(
    () =>
      mapModifier(dragSensitivity, (factor): InputEventOption => [
        'raw',
        step * factor,
      ]),
    [dragSensitivity, step],
  )

  /**
   * Set once the drag has actually moved the value, so that the press-and-hold
   * repeat of a stepper stands down and leaves the value to the drag. A ref,
   * because it is read from inside the repeat rather than rendered.
   */
  const draggingRef = useRef(false)
  /**
   * Where the drag started, taken on the first move rather than on pointer
   * down: the steppers act on pointer down, so by then the value may already
   * have been nudged once, and the drag should carry on from there.
   */
  const originRef = useRef<{ y: number; value: number } | null>(null)
  /**
   * Which modifier the drag is currently counting at, and where the previous
   * event was — a key produces no pointer event of its own, so a change is
   * only seen on the next move and has to be dated back to the one before it.
   */
  const factorRef = useRef<number>(1)
  const previousYRef = useRef(0)

  const dragRefCallback = useDrag<HTMLDivElement>({
    threshold: 1,
    cursor: readonly ? undefined : 'ns-resize',
    onDragStart: (state) => {
      originRef.current = null
      draggingRef.current = false
      factorRef.current = selectModifier(dragSensitivity, state.event).value
    },
    onDrag: (_x, y, _dx, _dy, state) => {
      if (readonly || drag === null) return
      if (!originRef.current) {
        originRef.current = { y, value }
        previousYRef.current = y
        return
      }

      // Pressing or releasing the key mid-drag must not move the value, so the
      // travel so far is folded into the origin and measuring starts again
      // from the previous event: that event's own distance belongs to the new
      // sensitivity.
      const factor = selectModifier(dragSensitivity, state.event).value
      if (factor !== factorRef.current) {
        originRef.current = { y: previousYRef.current, value }
        factorRef.current = factor
      }
      previousYRef.current = y

      // Dragging up raises the value, as on a knob.
      const steps = Math.round(-(y - originRef.current.y) / drag)
      if (steps === 0) return
      draggingRef.current = true
      // The same pipeline the wheel and the arrow keys use. Counting from where
      // the drag started keeps it from accumulating a rounding error.
      changeValue(
        applyDelta(
          originRef.current.value,
          steps,
          dragOptions,
          range,
          state.event,
        ),
      )
    },
    onDragEnd: () => {
      draggingRef.current = false
    },
  })

  const composedRef = useComposedRefs<HTMLDivElement>(
    ref,
    drag !== null && !readonly ? dragRefCallback : undefined,
  )

  const context = useMemo(() => ({ draggingRef }), [])

  return (
    <StepperProvider value={context}>
      <div
        ref={composedRef}
        className={cx('tremolo-number-input-stepper', className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    </StepperProvider>
  )
}
