import { ComponentPropsWithoutRef } from 'react'

import {
  StepperArrow,
  StepperButton,
  StepperButtonProps,
} from './StepperButton'

export type NumberInputIncrementStepperProps = StepperButtonProps

/** Raises the value by one `step`, repeating while held. */
export function IncrementStepper(
  props: NumberInputIncrementStepperProps &
    Omit<
      ComponentPropsWithoutRef<'div'>,
      keyof NumberInputIncrementStepperProps
    >,
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
