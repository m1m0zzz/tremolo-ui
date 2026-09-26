import { useEffect } from 'react'

import { checkSteps, type CheckStepsOptions } from '@tremolo-ui/dom'

/**
 * Warn, in development only, when a key press or a wheel notch cannot produce
 * a change the user can see. The probing is `checkSteps` in the core.
 *
 * @internal
 */
export function useCheckSteps(options: CheckStepsOptions) {
  const { component, axis, range, keyboard, wheel } = options
  const { min, max, step, scale } = range ?? {}

  useEffect(() => {
    try {
      // Inline and first, so a bundler folds the comparison and drops the
      // whole block — and with it the only call to `checkSteps`, which then
      // falls out of the bundle too. See `useCheckPlacement` for why it
      // cannot go through a helper, and why it is wrapped.
      if (process.env.NODE_ENV === 'production') return
      for (const warning of checkSteps(options)) console.warn(warning)
    } catch {
      // No bundler substituted NODE_ENV, so a production build cannot be told
      // from a development one. Say nothing rather than break.
    }
    // `range` and `format` are rebuilt on most renders, so the effect is keyed
    // on what actually decides the outcome. `format` is left out on purpose:
    // an inline arrow function would make this run every render.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [component, axis, min, max, step, scale, keyboard, wheel])
}
