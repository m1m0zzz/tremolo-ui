import { inject, provide, type InjectionKey } from 'vue'

const PLACEMENT: InjectionKey<string> = Symbol('tremolo-ui placement')

/**
 * Mark the children of this component as being inside `name`, for
 * {@link checkPlacement}. Call it during `setup`.
 */
export function providePlacement(name: string) {
  provide(PLACEMENT, name)
}

/**
 * Warn, in development only, when `child` is rendered outside `parent`. A
 * part positioned against its parent still renders anywhere else, so nothing
 * fails when it is misplaced — its position just comes out wrong. The names
 * are the ones written in templates (`'KnobThumb'`), since they are what the
 * warning shows. Call it during `setup`.
 */
export function checkPlacement(child: string, parent: string) {
  try {
    // Inline and first, so that a bundler folds the comparison and drops the
    // message with it. Wrapped because `process` may not exist at all.
    if (process.env.NODE_ENV === 'production') return
    const found = inject(PLACEMENT, null)
    if (found === parent) return
    console.warn(
      `[tremolo-ui] ${child} has to be rendered inside ${parent}` +
        (found === null ? '.' : `, but it is inside ${found}.`) +
        ' It renders either way, so nothing fails — its position just' +
        ' comes out wrong.',
    )
  } catch {
    // No bundler substituted NODE_ENV. Say nothing rather than break.
  }
}
