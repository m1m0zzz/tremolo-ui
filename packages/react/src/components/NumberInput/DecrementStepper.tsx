import {
  StepperArrow,
  StepperButton,
  type StepperButtonProps,
} from './StepperButton'

/** Lowers the value by one `step`, repeating while held. */
export function DecrementStepper(props: StepperButtonProps) {
  return (
    <StepperButton
      direction={-1}
      variant="decrement"
      icon={<StepperArrow up={false} />}
      {...props}
    />
  )
}
