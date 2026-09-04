import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
  Ref,
  useMemo,
  useRef,
} from 'react'

import { applyDelta } from '@tremolo-ui/functions'

import { useDrag } from '../../hooks/useDrag'
import { useComposedRefs } from '../_util/composeRefs'

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
  const { value, step, readonly, drag, range, changeValue } =
    useNumberInputContext()

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

  const dragRefCallback = useDrag<HTMLDivElement>({
    threshold: 1,
    cursor: readonly ? undefined : 'ns-resize',
    onDragStart: () => {
      originRef.current = null
      draggingRef.current = false
    },
    onDrag: (_x, y) => {
      if (readonly || drag == null) return
      if (!originRef.current) {
        originRef.current = { y, value }
        return
      }
      // Dragging up raises the value, as on a knob.
      const steps = Math.round(-(y - originRef.current.y) / drag)
      if (steps == 0) return
      draggingRef.current = true
      // The same pipeline the wheel and the arrow keys use. Counting from where
      // the drag started keeps it from accumulating a rounding error.
      changeValue(
        applyDelta(originRef.current.value, steps, ['raw', step], range),
      )
    },
    onDragEnd: () => {
      draggingRef.current = false
    },
  })

  const composedRef = useComposedRefs<HTMLDivElement>(
    ref,
    drag != null && !readonly ? dragRefCallback : undefined,
  )

  const context = useMemo(() => ({ draggingRef }), [])

  return (
    <StepperProvider value={context}>
      <div
        ref={composedRef}
        className={clsx('tremolo-number-input-stepper', className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    </StepperProvider>
  )
}
