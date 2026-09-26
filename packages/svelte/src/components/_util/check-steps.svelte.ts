import { DEV } from 'esm-env'

import { checkSteps, type CheckStepsOptions } from '@tremolo-ui/dom'

/**
 * Warn, in development only, when a key press or a wheel notch cannot produce
 * a change the user can see. The probing is `checkSteps` in the core; `DEV`
 * is a constant the bundler folds, so production builds drop the call.
 *
 * Takes a getter, so that the check runs again when the settings change.
 */
export function useCheckSteps(options: () => CheckStepsOptions) {
  if (!DEV) return
  $effect(() => {
    for (const warning of checkSteps(options())) console.warn(warning)
  })
}
