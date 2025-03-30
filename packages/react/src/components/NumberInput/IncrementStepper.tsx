import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

import { useLongPress } from '../../hooks/useLongPress'

import { useNumberInputContext } from './context'

/** @category NumberInput */
export interface IncrementStepperProps {
  size?: number
  children?: ReactNode
}

/** @category NumberInput */
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

  const press = useLongPress(increment)

  return (
    <div
      className={clsx('tremolo-number-input-increment-stepper', className)}
      role="button"
      tabIndex={-1}
      aria-disabled={
        keepWithinRange && valueAsNumber >= (max ?? Number.MAX_SAFE_INTEGER)
      }
      onPointerDown={press}
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
