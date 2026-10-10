import styles from './Segments.module.css'

interface Props {
  /**
   * What to show, padded with spaces to the width of the display, so the
   * unlit segments stay where they are.
   */
  value: string
  /**
   * DSEG7 has the seven segments of a number display; DSEG14 the fourteen
   * of an alphanumeric one, which can spell words.
   */
  segments?: 7 | 14
  className?: string
}

/** The character with every segment of a cell lit. */
const ALL = { 7: '8', 14: '~' }

/**
 * Text on a segment display: the lit segments over the faint, unlit ones
 * that a real display shows through.
 */
export function Segments({ value, segments = 7, className }: Props) {
  // In DSEG a space is narrower than a cell; `!` is the blank as wide as one.
  const lit = value.replaceAll(' ', '!')
  // The point and the colon sit between cells rather than in one.
  const unlit = lit.replace(/[^.:]/g, ALL[segments])
  return (
    <span
      className={[styles.display, className].filter(Boolean).join(' ')}
      data-segments={segments}
    >
      <span className={styles.unlit} aria-hidden>
        {unlit}
      </span>
      <span className={styles.lit} aria-label={value.trim()}>
        {lit}
      </span>
    </span>
  )
}
