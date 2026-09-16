import { ComponentPropsWithoutRef } from 'react'

import {
  StepperArrow,
  StepperButton,
  StepperButtonProps,
} from './StepperButton'

// An interface rather than an alias, so that typedoc lists the props: the
// shared `StepperButtonProps` is not exported for it to follow.
export interface NumberInputIncrementStepperProps extends StepperButtonProps {}

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
