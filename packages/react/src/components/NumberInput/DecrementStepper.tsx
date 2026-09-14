import { ComponentPropsWithoutRef } from 'react'

import {
  StepperArrow,
  StepperButton,
  StepperButtonProps,
} from './StepperButton'

export type NumberInputDecrementStepperProps = StepperButtonProps

/** Lowers the value by one `step`, repeating while held. */
export function DecrementStepper(
  props: NumberInputDecrementStepperProps &
    Omit<
      ComponentPropsWithoutRef<'div'>,
      keyof NumberInputDecrementStepperProps
    >,
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
