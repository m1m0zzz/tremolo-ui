import { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react'

import { useComposedRefs } from '../../compose-refs'
import { useDropZone } from '../../hooks/useDropZone'

export interface DropZoneProps {
  /**
   * Which files to take, written the way the `accept` attribute of a file
   * input is: a comma separated list of extensions (`.wav`), MIME types
   * (`audio/wav`) and type groups (`audio/*`).
   *
   * What does not match goes to `onReject` rather than `onDrop`. While the
   * drag is still in the air the element is marked `[data-invalid]`, as far as
   * the browser lets it be told apart — a rule written as an extension cannot
   * be decided until the drop.
   */
  accept?: string
  /**
   * Take more than one file from a single drop. With it off, only the first
   * accepted file is reported, as a file input without `multiple` does.
   *
   * @default false
   */
  multiple?: boolean
  /**
   * Refuse the drop. The drag is still swallowed rather than let through: an
   * unhandled drop makes the browser leave the page and open the file.
   *
   * @default false
   */
  disabled?: boolean

  /**
   * Called with the dropped files that match `accept`.
   *
   * @param event the drop, for anything the files leave out — where on the
   * element it landed, most of all.
   */
  onDrop?: (files: File[], event: DragEvent) => void
  /**
   * Called with the dropped files that do not match `accept`, so that the
   * reason can be shown.
   */
  onReject?: (files: File[], event: DragEvent) => void

  /** What the zone shows. */
  children: ReactNode
}

type Props = DropZoneProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof DropZoneProps>

/**
 * An area that takes files dropped onto it.
 *
 * To make an element you already have into a drop target, without wrapping it
 * in anything, use the `useDropZone` hook this is built on.
 */
export const Root = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(
  (
    {
      accept,
      multiple = false,
      disabled = false,
      onDrop,
      onReject,
      children,
      ...props
    },
    ref,
  ) => {
    const { refCallback, over, invalid } = useDropZone<HTMLDivElement>({
      accept,
      multiple,
      disabled,
      onDrop,
      onReject,
    })
    const composedRef = useComposedRefs<HTMLDivElement>(ref, refCallback)

    return (
      <div
        ref={composedRef}
        data-dragover={over ? '' : undefined}
        data-invalid={invalid ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        {...props}
      >
        {children}
      </div>
    )
  },
)

/**
 * An area that takes files dropped onto it.
 */
export const DropZone = {
  Root,
}
