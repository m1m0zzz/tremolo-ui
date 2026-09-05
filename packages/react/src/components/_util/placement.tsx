import { createContext, ReactNode, useContext, useEffect } from 'react'

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
    try {
      // `process.env.NODE_ENV` is written out here, inline and first, so that a
      // bundler substituting it folds the comparison and drops this whole
      // block — the message strings with it. Reading the flag through a helper
      // or a module constant leaves the branch in the bundle instead: neither
      // folds, which was measured with esbuild rather than assumed.
      //
      // The read is wrapped because `process` may not exist at all. The
      // package is built with `platform: 'neutral'`, so a page loading the ESM
      // straight from a CDN has no bundler to substitute it, and a bare
      // reference would throw a `ReferenceError` mid-effect.
      if (process.env.NODE_ENV !== 'production' && found !== parent) {
        console.warn(
          `[tremolo-ui] ${child} has to be rendered inside ${parent}` +
            (found === null ? '.' : `, but it is inside ${found}.`) +
            ' It renders either way, so nothing fails — its position just' +
            ' comes out wrong.',
        )
      }
    } catch {
      // No bundler substituted NODE_ENV, so there is no way to tell a
      // production build from a development one. Say nothing rather than break.
    }
  }, [found, child, parent])
}
