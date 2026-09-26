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
  // Reversed before rounding, so that a value halfway between two whole
  // percentages lands on the same one whichever end it is measured from.
  const normalized = scale.normalize(value, min, max)
  return toFixed((reversed ? 1 - normalized : normalized) * 100)
}
