import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  forwardRef,
  ReactNode,
  useId,
  useMemo,
} from 'react'

import { partitionByAccept, visuallyHiddenStyle } from '@tremolo-ui/dom'

import { FileInputProvider } from './context'
import { Trigger } from './Trigger'

export interface FileInputProps {
  /**
   * Which files to take, written the way the HTML attribute is: a comma
   * separated list of extensions (`.wav`), MIME types (`audio/wav`) and type
   * groups (`audio/*`).
   *
   * **The browser treats it as a hint to the picker, not a rule.** A person
   * can switch the picker to "All Files", so what arrives is checked again
   * here, and anything that does not match goes to `onReject` instead.
   */
  accept?: string
  /**
   * Let more than one file be picked at a time.
   * @default false
   */
  multiple?: boolean
  /**
   * Refuse to open the picker, and mark every part with `[data-disabled]`.
   * @default false
   */
  disabled?: boolean

  /**
   * Called with the files that were picked and match `accept`.
   *
   * It is not called at all when the picker is dismissed, or when every file
   * picked was rejected — an empty array never arrives, so there is no need to
   * tell "nothing was chosen" from "the choice was cleared".
   */
  onChange?: (files: File[]) => void
  /**
   * Called with the files that were picked and do not match `accept`, so that
   * the reason can be shown. Given alongside `onChange` when a selection held
   * both.
   */
  onReject?: (files: File[]) => void

  /** Normally a `FileInput.Trigger`, and whatever shows what was picked. */
  children: ReactNode
}

type Props = FileInputProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof FileInputProps>

/**
 * Hands over the files a person picked.
 *
 * The `<input type="file">` is here, kept out of sight but in the tab order,
 * because it is the control: it takes the focus, opens the picker on Enter,
 * and carries the accessible name. What is on screen is whatever the children
 * draw.
 */
export const Root = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(
  (
    {
      accept,
      multiple = false,
      disabled = false,
      onChange,
      onReject,
      children,
      // Pulled out of `props` so that they land on the input rather than on
      // the wrapper: it is the control, and a description is only announced
      // from the element that takes the focus. No declaration in
      // `FileInputProps` is needed for this — they are already on the div
      // attributes it is merged with, with the same types.
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      ...props
    },
    ref,
  ) => {
    const inputId = useId()

    const context = useMemo(() => ({ inputId, disabled }), [inputId, disabled])

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const { accepted, rejected } = partitionByAccept(
        Array.from(event.target.files ?? []),
        accept,
      )

      // Picking the same file twice fires no second change event while the
      // value is still on the input, so it is cleared as soon as it is read.
      // Nothing is lost: the files are already in hand.
      event.target.value = ''

      if (rejected.length > 0) onReject?.(rejected)
      if (accepted.length > 0) onChange?.(accepted)
    }

    return (
      <FileInputProvider value={context}>
        <div ref={ref} data-disabled={disabled ? '' : undefined} {...props}>
          <input
            id={inputId}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            style={visuallyHiddenStyle}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            aria-describedby={ariaDescribedby}
            onChange={handleChange}
          />
          {children}
        </div>
      </FileInputProvider>
    )
  },
)

/**
 * Picks files, and hands them over as `File`s.
 */
export const FileInput = {
  Root,
  Trigger,
}

export { useFileInputContext, type FileInputContextValue } from './context'
export { type FileInputTriggerProps } from './Trigger'
