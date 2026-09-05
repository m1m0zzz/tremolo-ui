import { createContext, ReactNode, useContext, useEffect } from 'react'

/**
 * The package is built with `platform: 'neutral'`, so `process` may not exist
 * at all: a page loading the ESM build straight from a CDN has no bundler to
 * substitute it, and reading it unguarded would throw a `ReferenceError`.
 *
 * Read where it is used rather than once at module scope: a bundler folds the
 * comparison away either way, and this keeps it observable to a test.
 */
function isProduction() {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
}

/**
 * The subcomponent that established the current placement, if any.
 *
 * @internal
 */
const PlacementContext = createContext<string | null>(null)

/**
 * Marks its children as being inside `name`, for {@link useCheckPlacement}.
 *
 * @internal
 */
export function Placement({
  name,
  children,
}: {
  name: string
  children: ReactNode
}) {
  return (
    <PlacementContext.Provider value={name}>
      {children}
    </PlacementContext.Provider>
  )
}

/**
 * Warn, in development only, when `child` is not rendered inside `parent`.
 *
 * A compound component renders its children exactly as they are composed, so a
 * subcomponent put at the wrong level still renders — it only loses whatever
 * its layout depended on, and does so silently. `Slider.Thumb` outside
 * `Slider.Track` keeps its `position: absolute` but resolves it against the
 * page rather than the track, and neither the build nor the tests notice.
 *
 * @internal
 */
export function useCheckPlacement(child: string, parent: string) {
  const found = useContext(PlacementContext)

  useEffect(() => {
    if (found === parent || isProduction()) return
    console.warn(
      `[tremolo-ui] ${child} has to be rendered inside ${parent}` +
        (found === null ? '.' : `, but it is inside ${found}.`) +
        ' It renders either way, so nothing fails — its position just comes' +
        ' out wrong.',
    )
  }, [found, child, parent])
}
