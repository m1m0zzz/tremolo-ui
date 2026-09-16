import { ComponentPropsWithoutRef } from 'react'

import { StepperArrow, StepperButton } from './StepperButton'

/** Raises the value by one `step`, repeating while held. */
export function IncrementStepper(props: ComponentPropsWithoutRef<'div'>) {
  return (
    <StepperButton
      direction={1}
      variant="increment"
      icon={<StepperArrow up />}
      {...props}
    />
  )
}
