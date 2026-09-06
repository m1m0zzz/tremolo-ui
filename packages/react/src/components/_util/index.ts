/**
 * `cursor` values a component accepts for `externalStyles.cursor`. They are
 * handed to `createDrag`, which applies the value to the dragged element.
 */
export type Cursor = 'grabbing' | 'grab' | 'pointer' | 'move' | 'none'

/**
 * Properties set on `<body>` while a drag is in progress, and what they were
 * before. `user-select: none` on the dragged element only covers its own text;
 * a drag that leaves it would otherwise select whatever it passes over.
 *
 * The prefixed property is here for the same reason `createDrag` sets it:
 * Safari wants it.
 */
const DRAGGING_BODY_STYLE = [
  ['user-select', 'none'],
  ['-webkit-user-select', 'none'],
] as const

/**
 * Two components can be dragged at once with two fingers, so this counts
 * rather than toggles: the first drag saves and sets, the last one restores.
 * Restoring on the first release would leave the second drag selecting text.
 */
let dragging = 0
let previous: string[] = []

export function addUserSelectNone() {
  const style = window.document.body.style
  if (dragging === 0) {
    previous = DRAGGING_BODY_STYLE.map(([property]) =>
      style.getPropertyValue(property),
    )
    for (const [property, value] of DRAGGING_BODY_STYLE) {
      style.setProperty(property, value)
    }
  }
  dragging += 1
}

export function removeUserSelectNone() {
  if (dragging === 0) return
  dragging -= 1
  if (dragging > 0) return

  const style = window.document.body.style
  DRAGGING_BODY_STYLE.forEach(([property], i) => {
    // An empty string removes the declaration, which is what was there before
    // if the page never set one.
    style.setProperty(property, previous[i] ?? '')
  })
  previous = []
}
