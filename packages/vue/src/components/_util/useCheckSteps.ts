import { watchEffect } from 'vue'

import { checkSteps, type CheckStepsOptions } from '@tremolo-ui/dom'

/**
 * Warn, in development only, when a key press or a wheel notch cannot produce
 * a change the user can see. The probing is `checkSteps` in the core.
 *
 * Takes a getter, so that the check runs again when the settings change.
 */
export function useCheckSteps(options: () => CheckStepsOptions) {
  try {
    // Inline and first, so that a bundler folds the comparison and drops the
    // only call to `checkSteps`, which then falls out of the bundle too.
    if (process.env.NODE_ENV === 'production') return
    watchEffect(() => {
      for (const warning of checkSteps(options())) console.warn(warning)
    })
  } catch {
    // No bundler substituted NODE_ENV. Say nothing rather than break.
  }
}
