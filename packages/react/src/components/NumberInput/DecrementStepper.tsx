import { ComponentPropsWithoutRef } from 'react'

import {
  StepperArrow,
  StepperButton,
  StepperButtonProps,
} from './stepperButton'

export type DecrementStepperProps = StepperButtonProps

/** Lowers the value by one `step`, repeating while held. */
export function DecrementStepper(
  props: DecrementStepperProps &
    Omit<ComponentPropsWithoutRef<'div'>, keyof DecrementStepperProps>,
) {
  return (
    <StepperButton
      direction={-1}
      variant="decrement"
      icon={<StepperArrow up={false} />}
      {...props}
    />
  )
}
