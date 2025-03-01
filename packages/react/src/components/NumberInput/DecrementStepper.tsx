import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode, useCallback } from 'react'

import { useDispatch, useStore } from './context'

export interface DecrementStepperProps {
  size?: number
  children?: ReactNode
}

export function DecrementStepper({
  size = 12,
  children,
  className,
  ...props
}: DecrementStepperProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof DecrementStepperProps>) {
  const { valueAsNumber, min, keepWithinRange } = useStore()
  const dispatch = useDispatch()
  const handleDecrement = useCallback(() => {
    dispatch({ type: 'decrement' })
  }, [dispatch])

  // TODO: add long press event

  return (
    <div
      className={clsx('tremolo-number-input-decrement-stepper', className)}
      role="button"
      tabIndex={-1}
      aria-disabled={keepWithinRange && valueAsNumber <= min}
      onPointerDown={handleDecrement}
      {...props}
    >
      {children || (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </div>
  )
}
