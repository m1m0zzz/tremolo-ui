import clsx from 'clsx'
import { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react'

import { InputEventOption } from '@tremolo-ui/functions'

import { NumberInputProvider } from './context'
import { DecrementStepper } from './DecrementStepper'
import { IncrementStepper } from './IncrementStepper'
import { InternalInput } from './InternalInput'
import { Stepper } from './Stepper'
import { Units } from './type'

/*
TODO
- numberMode: focusが当たった時だけ、parse + type="number"にする
- skew
*/

/** @category NumberInput */
export interface NumberInputProps {
  value: number | string

  /**
   * Number.MIN_SAFE_INTEGER
   */
  min?: number
  /**
   * Number.MAX_SAFE_INTEGER
   */
  max?: number
  step?: number

  /**
   * @example
   * units='Hz'
   * units={[['Hz', 1], ['kHz', 1000]]}
   * units={[['ms', 1], ['s', 1000]]}
   */
  units?: string | Units

  /**
   * Digits for rounding numbers.
   * @example
   * with:
   * units={[['Hz', 1], ['kHz', 1000]]}
   * digit={3}
   * results:
   * value=100 -> 100Hz, value=1600 -> 1.60Hz
   */
  digit?: number

  readonly?: boolean

  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled'

  selectWithFocus?: 'all' | 'number' | 'none'
  blurOnEnter?: boolean
  keepWithinRange?: boolean
  clampValueOnBlur?: boolean

  /**
   * wheel control option
   */
  wheel?: InputEventOption | null
  /**
   * keyboard control option
   */
  keyboard?: InputEventOption | null

  activeColor?: string

  wrapperClassName?: string

  onChange?: (value: number, text: string) => void
  onFocus?: (
    value: number,
    text: string,
    event: React.FocusEvent<HTMLInputElement, Element>,
  ) => void
  onBlur?: (
    value: number,
    text: string,
    event: React.FocusEvent<HTMLInputElement, Element>,
  ) => void

  children?: ReactNode
}

/**
 * @category NumberInput
 */
export interface NumberInputMethods {
  focus: () => void
  blur: () => void
}

type Props = NumberInputProps &
  Omit<ComponentPropsWithoutRef<'input'>, keyof NumberInputProps | 'type'>

const NumberInputImpl = forwardRef<NumberInputMethods, Props>(
  (
    {
      value,
      min,
      max,
      step = 1,
      units,
      readonly = false,
      disabled = false,
      digit,
      variant = 'outline',
      selectWithFocus = 'none',
      blurOnEnter = true,
      keepWithinRange = true,
      clampValueOnBlur = true,
      wheel = ['raw', 1],
      keyboard = ['raw', 1],
      activeColor,
      wrapperClassName,
      className,
      onChange,
      onFocus,
      onBlur,
      children,
      ...props
    }: Props,
    forwardedRef,
  ) => {
    const colors: Record<string, string | undefined> = {
      '--active-color': activeColor,
    }
    return (
      <NumberInputProvider
        value={String(value)}
        min={min}
        max={max}
        step={step}
        units={units}
        digit={digit}
        readonly={readonly}
        keepWithinRange={keepWithinRange}
        onChange={onChange}
      >
        <div
          className={clsx('tremolo-number-input-wrapper', wrapperClassName)}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          style={{
            ...colors,
          }}
          data-stepper={!!children}
          data-variant={variant}
        >
          <InternalInput
            ref={forwardedRef}
            readonly={readonly}
            disabled={disabled}
            selectWithFocus={selectWithFocus}
            blurOnEnter={blurOnEnter}
            clampValueOnBlur={clampValueOnBlur}
            wheel={wheel}
            keyboard={keyboard}
            className={className}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />
          {children}
        </div>
      </NumberInputProvider>
    )
  },
)

/**
 * Input with some useful functions for entering numerical values.
 * @category NumberInput
 */
export const NumberInput = Object.assign(NumberInputImpl, {
  Stepper,
  IncrementStepper,
  DecrementStepper,
})

export { type StepperProps } from './Stepper'
export { type IncrementStepperProps } from './IncrementStepper'
export { type DecrementStepperProps } from './DecrementStepper'
export { type Units } from './type'
