import { createContext } from 'svelte'

import type {
  InputEventOption,
  ModifierState,
  ModifierValue,
} from '@tremolo-ui/dom'
import type { ValueRange } from '@tremolo-ui/functions'

/** What `NumberInput.Root` shares with its parts. Every field is a getter. */
export interface NumberInputContextValue {
  readonly value: number
  readonly min: number | undefined
  readonly max: number | undefined
  readonly step: number
  readonly disabled: boolean
  readonly readonly: boolean
  readonly keyboard: ModifierValue<InputEventOption> | null
  readonly drag: number | null
  readonly dragSensitivity: ModifierValue<number>
  readonly pointerLock: boolean
  readonly selectOnFocus: 'all' | 'number' | 'none'
  readonly unformatOnFocus: boolean
  readonly keepCaretOnStep: boolean
  readonly blurOnEnter: boolean
  /** The text the field shows: the draft while typing, else `format(value)`. */
  readonly text: string
  /** Whether the user has typed since the value was last committed. */
  readonly editing: boolean
  readonly outOfRange: boolean
  readonly atMin: boolean
  readonly atMax: boolean
  /** The range a raw amount moves across, for the stepper drag. */
  readonly rawRange: ValueRange
  /** Keep typed text as the draft, reporting the number in it. */
  setDraft: (text: string) => void
  /** Commit the draft, clamped, or drop it when it holds no number. */
  commitDraft: () => void
  /** Set the value, dropping any draft. */
  changeValue: (value: number) => void
  /** Move the value by one press of `option`. */
  nudge: (
    direction: number,
    option: ModifierValue<InputEventOption>,
    modifiers?: ModifierState,
  ) => void
  /** @internal `InputField` registers the element focus() moves to. */
  setInput: (input: HTMLInputElement | null) => void
}

const [get, set] = createContext<NumberInputContextValue>()

/** The context of the enclosing `NumberInput.Root`, for a part of your own. */
export const useNumberInputContext = get
export const setNumberInputContext = set

/** @internal Whether the drag on `Stepper` has moved the value. */
export interface StepperContextValue {
  moved: () => boolean
}

const [getStepper, setStepper, hasStepper] =
  createContext<StepperContextValue>()

export const useStepperContext = () => (hasStepper() ? getStepper() : null)
export const setStepperContext = setStepper
