import { createContext } from 'svelte'

/** What `FileInput.Root` shares with `FileInput.Trigger`. */
export interface FileInputContextValue {
  /** The id of the file input, for the trigger's `for`. */
  readonly inputId: string
  readonly disabled: boolean
}

const [get, set] = createContext<FileInputContextValue>()

/** The context of the enclosing `FileInput.Root`, for a part of your own. */
export const useFileInputContext = get
export const setFileInputContext = set
