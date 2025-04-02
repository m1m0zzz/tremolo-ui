import clsx from 'clsx'
import { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react'

import { InputEventOption } from '@tremolo-ui/functions'
import { Units } from '@tremolo-ui/functions/NumberInput'

import { NumberInputProvider } from './context'
import { InternalInput } from './InternalInput'

/*
TODO
- numberMode: focusが当たった時だけ、parse + type="number"にする
- skew
- defaultValue
*/

/** @category NumberInput */
export interface NumberInputProps {
  value: number | string

  /**
   * @default Number.MIN_SAFE_INTEGER
   */
  min?: number
  /**
   * @default Number.MAX_SAFE_INTEGER
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

  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled'

  selectWithFocus?: 'all' | 'number' | 'none'
  blurOnEnter?: boolean
  keepWithinRange?: boolean
  clampValueOnBlur?: boolean

  // TODO
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

/**
 * Input with some useful functions for entering numerical values.
 * @category NumberInput
 */
export const NumberInput = forwardRef<NumberInputMethods, Props>(
  (
    {
      value,
      min,
      max,
      step = 1,
      units,
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
    ref,
  ) => {
    const colors: { [key: string]: string | undefined } = {
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
        keepWithinRange={keepWithinRange}
        onChange={onChange}
      >
        <div
          className={clsx('tremolo-number-input-wrapper', wrapperClassName)}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          data-stepper={!!children}
          data-variant={variant}
          style={{
            ...colors,
          }}
        >
          <InternalInput
            ref={ref}
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

export * from './Stepper'
export * from './IncrementStepper'
export * from './DecrementStepper'
