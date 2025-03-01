import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode, useCallback } from 'react'

import { useDispatch, useStore } from './context'

export interface IncrementStepperProps {
  size?: number
  children?: ReactNode
}

export function IncrementStepper({
  size = 12,
  children,
  className,
  ...props
}: IncrementStepperProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof IncrementStepperProps>) {
  const { valueAsNumber, max, keepWithinRange } = useStore()
  const dispatch = useDispatch()
  const handleIncrement = useCallback(() => {
    dispatch({ type: 'increment' })
  }, [dispatch])

  // TODO: add long press event

  return (
    <div
      className={clsx('tremolo-number-input-increment-stepper', className)}
      role="button"
      tabIndex={-1}
      aria-disabled={keepWithinRange && valueAsNumber >= max}
      onPointerDown={handleIncrement}
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
          <polyline points="18 15 12 9 6 15" />
        </svg>
      )}
    </div>
  )
}
