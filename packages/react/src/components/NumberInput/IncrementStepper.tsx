import { ComponentPropsWithoutRef } from 'react'

import {
  StepperArrow,
  StepperButton,
  StepperButtonProps,
} from './stepperButton'

export type IncrementStepperProps = StepperButtonProps

/** Raises the value by one `step`, repeating while held. */
export function IncrementStepper(
  props: IncrementStepperProps &
    Omit<ComponentPropsWithoutRef<'div'>, keyof IncrementStepperProps>,
) {
  return (
    <StepperButton
      direction={1}
      variant="increment"
      icon={<StepperArrow up />}
      {...props}
    />
  )
}
