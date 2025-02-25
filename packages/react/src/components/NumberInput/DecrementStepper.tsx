import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

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
  return (
    <div
      className={clsx('tremolo-number-input-decrement-stepper', className)}
      role="button"
      tabIndex={-1}
      {...props}
    >
      {children || (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </div>
  )
}
