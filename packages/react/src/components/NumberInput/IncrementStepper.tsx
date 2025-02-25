import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

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
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      className={clsx('tremolo-number-input-increment-stepper', className)}
      role="button"
      tabIndex={-1}
      onClick={() => {
        console.log('IncrementStepper')
      }}
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
          <polyline points="18 15 12 9 6 15" />
        </svg>
      )}
    </div>
  )
}
