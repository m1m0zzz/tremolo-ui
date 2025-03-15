import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

import { useNumberInputContext } from './context'

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
  const max = useNumberInputContext((s) => s.max)
  const valueAsNumber = useNumberInputContext((s) => s.valueAsNumber)
  const keepWithinRange = useNumberInputContext((s) => s.keepWithinRange)
  const increment = useNumberInputContext((s) => s.increment)

  // TODO: add long press event

  return (
    <div
      className={clsx('tremolo-number-input-increment-stepper', className)}
      role="button"
      tabIndex={-1}
      aria-disabled={
        keepWithinRange && valueAsNumber >= (max ?? Number.MAX_SAFE_INTEGER)
      }
      onPointerDown={increment}
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
