import {
  ComponentPropsWithoutRef,
  forwardRef,
  ReactNode,
  CSSProperties,
} from 'react'

import { useFileInputContext } from './context'

import type { CSSVariables } from '../../css-variables'

export interface FileInputTriggerProps {
  /** What the trigger reads. It is the accessible name of the file input. */
  children: ReactNode

  style?: CSSProperties & CSSVariables
}

type Props = FileInputTriggerProps &
  Omit<
    ComponentPropsWithoutRef<'label'>,
    keyof FileInputTriggerProps | 'htmlFor'
  >

/**
 * Opens the file picker, and names the input for a screen reader.
 *
 * A `<label>` rather than a `<button>`: the browser forwards the click to the
 * input on its own, the input stays the one thing in the tab order, and its
 * accessible name comes from this text without an `aria-label` to keep in
 * step. A disabled input ignores the click, so nothing has to be intercepted.
 */
export const Trigger = /* @__PURE__ */ forwardRef<HTMLLabelElement, Props>(
  ({ children, ...props }, ref) => {
    const { inputId, disabled } = useFileInputContext()

    return (
      <label
        ref={ref}
        htmlFor={inputId}
        data-disabled={disabled ? '' : undefined}
        {...props}
      >
        {children}
      </label>
    )
  },
)
