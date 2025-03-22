import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

/** @category NumberInput */
export interface StepperProps {
  /** Display only when hovering. */
  dynamic?: boolean
  children?: ReactNode
}

/** @category NumberInput */
export function Stepper({
  dynamic = true,
  children,
  className,
  ...props
}: StepperProps & Omit<ComponentPropsWithoutRef<'div'>, keyof StepperProps>) {
  return (
    <div
      className={clsx('tremolo-number-input-stepper', className)}
      data-dynamic={dynamic}
      {...props}
    >
      {children}
    </div>
  )
}
