import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
  useCallback,
} from 'react'

import { useLongPress } from '../../hooks/useLongPress'

import { useNumberInputContext, useStepperContext } from './context'

export interface StepperButtonProps {
  className?: string
  style?: CSSProperties
  /** Replaces the default arrow. Size it with the `--stepper-icon-size` variable. */
  children?: ReactNode
}

type Props = StepperButtonProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof StepperButtonProps>

/**
 * Shared body of `IncrementStepper` and `DecrementStepper`: the two differ only
 * in which way they move the value and which arrow they draw.
 */
export function StepperButton({
  direction,
  variant,
  icon,
  className,
  style,
  children,
  onPointerDown,
  ...props
}: Props & {
  direction: 1 | -1
  variant: 'increment' | 'decrement'
  icon: ReactNode
}) {
  const { step, readonly, atMin, atMax, nudge } = useNumberInputContext()
  const stepper = useStepperContext()

  const press = useLongPress(
    useCallback(() => {
      // Once the pointer has actually travelled, the drag on `Stepper` owns the
      // value; repeating on top of it would move it twice.
      if (stepper?.draggingRef.current) return
      nudge(direction, ['raw', step])
    }, [stepper, nudge, direction, step]),
  )

  return (
    // eslint-disable-next-line jsx-a11y/role-supports-aria-props
    <div
      className={clsx(`tremolo-number-input-${variant}-stepper`, className)}
      role="button"
      tabIndex={-1}
      // A bare arrow has no accessible name of its own. Overridable, since a
      // caller may need it in their own language.
      aria-label={direction > 0 ? 'Increment' : 'Decrement'}
      aria-disabled={direction > 0 ? atMax : atMin}
      aria-readonly={readonly}
      style={style}
      onPointerDown={(event) => {
        if (!readonly) press()
        onPointerDown?.(event)
      }}
      {...props}
    >
      {children ?? icon}
    </div>
  )
}

export function StepperArrow({ up }: { up: boolean }) {
  return (
    <svg
      className="tremolo-number-input-stepper-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points={up ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
    </svg>
  )
}
