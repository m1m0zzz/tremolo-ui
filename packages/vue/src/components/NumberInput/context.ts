import { type InjectionKey } from 'vue'

import {
  type InputEventOption,
  type ModifierState,
  type ModifierValue,
} from '@tremolo-ui/dom'
import { type ValueRange } from '@tremolo-ui/functions'

import { injectContext } from '../_util/context'

/** What `NumberInput` shares with its parts. The fields are getters. */
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
  /** @internal `NumberInputField` registers the element focus() moves to. */
  setInput: (input: HTMLInputElement | null) => void
}

export const NumberInputKey: InjectionKey<NumberInputContextValue> =
  Symbol('NumberInput')

/** The context of the enclosing `NumberInput`, for a part of your own. */
export function useNumberInputContext(): NumberInputContextValue {
  return injectContext(NumberInputKey, 'NumberInput')
}

/** @internal Whether the drag on `NumberInputStepper` has moved the value. */
export const StepperKey: InjectionKey<{ moved: () => boolean }> =
  Symbol('NumberInputStepper')
