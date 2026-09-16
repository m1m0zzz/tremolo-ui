import { ComponentPropsWithoutRef } from 'react'

import { StepperArrow, StepperButton } from './StepperButton'

/** Lowers the value by one `step`, repeating while held. */
export function DecrementStepper(props: ComponentPropsWithoutRef<'div'>) {
  return (
    <StepperButton
      direction={-1}
      variant="decrement"
      icon={<StepperArrow up={false} />}
      {...props}
    />
  )
}
