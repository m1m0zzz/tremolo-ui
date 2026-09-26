import type { Snippet } from 'svelte'

export interface FileInputProps {
  /**
   * Which files to take, written the way the HTML attribute is: extensions
   * (`.wav`), MIME types (`audio/wav`) and type groups (`audio/*`). It is
   * checked again when the files arrive, since the picker only takes it as a
   * hint.
   */
  accept?: string
  /**
   * Let several files be picked at once.
   * @default false
   */
  multiple?: boolean
  /** Make the input unusable. The parts carry `data-disabled`. */
  disabled?: boolean
  /** Called with the picked files that satisfy `accept`. */
  onChange?: (files: File[]) => void
  /** Called with the picked files that do not satisfy `accept`. */
  onReject?: (files: File[]) => void
  /** The root element, bound with `bind:ref`. */
  ref?: HTMLDivElement | null
  children: Snippet
}
