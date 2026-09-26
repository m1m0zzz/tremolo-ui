import { DEV } from 'esm-env'
import { getContext, setContext } from 'svelte'

const PLACEMENT = Symbol('tremolo-ui placement')

/**
 * Mark the children of this component as being inside `name`, for
 * {@link checkPlacement}. Call it while the component initialises.
 */
export function setPlacement(name: string) {
  setContext(PLACEMENT, name)
}

/**
 * Warn, in development only, when `child` is rendered outside `parent`.
 *
 * A part positioned against its parent still renders anywhere else, so
 * nothing fails when it is misplaced — its position just comes out wrong.
 * The names are the ones written in markup (`'Knob.Thumb'`), since they are
 * what the warning shows. Call it while the component initialises.
 */
export function checkPlacement(child: string, parent: string) {
  if (!DEV) return
  const found = getContext<string | undefined>(PLACEMENT) ?? null
  if (found === parent) return
  console.warn(
    `[tremolo-ui] ${child} has to be rendered inside ${parent}` +
      (found === null ? '.' : `, but it is inside ${found}.`) +
      ' It renders either way, so nothing fails — its position just' +
      ' comes out wrong.',
  )
}
