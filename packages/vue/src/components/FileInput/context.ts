import { type InjectionKey } from 'vue'

import { injectContext } from '../_util/context'

/** What `FileInput` shares with `FileInputTrigger`. */
export interface FileInputContextValue {
  /** The id of the file input, for the trigger's `for`. */
  readonly inputId: string
  readonly disabled: boolean
}

export const FileInputKey: InjectionKey<FileInputContextValue> =
  Symbol('FileInput')

/** The context of the enclosing `FileInput`, for a part of your own. */
export function useFileInputContext(): FileInputContextValue {
  return injectContext(FileInputKey, 'FileInput')
}
