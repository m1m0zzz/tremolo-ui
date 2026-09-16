import {
  StepperArrow,
  StepperButton,
  type StepperButtonProps,
} from './StepperButton'

/** Raises the value by one `step`, repeating while held. */
export function IncrementStepper(props: StepperButtonProps) {
  return (
    <StepperButton
      direction={1}
      variant="increment"
      icon={<StepperArrow up />}
      {...props}
    />
  )
}
