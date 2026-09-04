import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
  Ref,
  useMemo,
  useRef,
} from 'react'

import type { AxisOptions, XY } from '@tremolo-ui/dom'

import { useDragValue } from '../../hooks/useDragValue'
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
 * up and down sweeps the value the way a knob does.
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
  const { value, min, max, step, skew, readonly, drag, changeValue } =
    useNumberInputContext()

  /**
   * Set once the drag has actually moved, so that the press-and-hold repeat of
   * a stepper stands down and leaves the value to the drag. A ref, because it
   * is read from inside the repeat rather than rendered.
   */
  const draggingRef = useRef(false)

  // A relative drag normalizes the value against the range, so an unbounded
  // input has nothing to sweep: 100px would move it by a rounding error.
  const dragEnabled = drag != null && min != undefined && max != undefined

  const axis = useMemo(
    (): XY<AxisOptions> => [
      { min: min ?? 0, max: max ?? 1, step, skew },
      // Dragging up raises the value, as on a knob.
      { min: min ?? 0, max: max ?? 1, step, skew, reverse: true },
    ],
    [min, max, step, skew],
  )

  const { refCallback: dragRefCallback } = useDragValue<HTMLDivElement>({
    axis,
    getValue: () => [value, value],
    pixelRange: drag ?? 100,
    // A click must not read as a drag: the steppers below act on pointer down.
    threshold: 3,
    cursor: readonly ? undefined : 'ns-resize',
    onChange: (v) => {
      draggingRef.current = true
      changeValue(v[1])
    },
    onDragEnd: () => {
      draggingRef.current = false
    },
  })

  const composedRef = useComposedRefs<HTMLDivElement>(
    ref,
    dragEnabled && !readonly ? dragRefCallback : undefined,
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
