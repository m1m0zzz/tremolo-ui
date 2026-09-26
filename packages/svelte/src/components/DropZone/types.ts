import type { Snippet } from 'svelte'

export interface DropZoneProps {
  /**
   * Which files to take, written the way the `accept` attribute of a file
   * input is.
   */
  accept?: string
  /**
   * Take every file dropped, rather than the first.
   * @default false
   */
  multiple?: boolean
  /** Ignore drops. The zone carries `data-disabled`. */
  disabled?: boolean
  /** Called with the dropped files that satisfy `accept`. */
  onDrop?: (files: File[], event: DragEvent) => void
  /** Called with the dropped files that do not satisfy `accept`. */
  onReject?: (files: File[], event: DragEvent) => void
  /** The root element, bound with `bind:ref`. */
  ref?: HTMLDivElement | null
  children: Snippet
}
