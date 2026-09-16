import { createContext, useContext } from 'react'

export type FileInputContextValue = {
  /** The id of the hidden `<input type="file">`, for `Trigger`'s `htmlFor`. */
  inputId: string
  disabled: boolean
}

const FileInputContext =
  /* @__PURE__ */ createContext<FileInputContextValue | null>(null)

export const FileInputProvider = FileInputContext.Provider

export function useFileInputContext(): FileInputContextValue
export function useFileInputContext<T>(
  selector: (state: FileInputContextValue) => T,
): T
export function useFileInputContext<T>(
  selector?: (state: FileInputContextValue) => T,
) {
  const context = useContext(FileInputContext)
  if (!context) throw new Error('Missing FileInputContext.Provider in the tree')
  return selector ? selector(context) : context
}
