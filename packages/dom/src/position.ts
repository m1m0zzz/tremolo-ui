import { linearScale, toFixed, type ValueRange } from '@tremolo-ui/functions'

/**
 * Where a value sits along a track, as a whole percentage from its start.
 *
 * Normalized along the scale, so a thumb, the fill behind it and the marks
 * all sit on the curve the drag follows. `reversed` measures from the other
 * end — for a track that grows upwards or leftwards on screen, since CSS
 * places things from the top and the left.
 */
export function valuePercent(
  value: number,
  { min, max, scale = linearScale }: Pick<ValueRange, 'min' | 'max' | 'scale'>,
  reversed = false,
): number {
  const percent = toFixed(scale.normalize(value, min, max) * 100)
  return reversed ? toFixed(100 - percent) : percent
}
