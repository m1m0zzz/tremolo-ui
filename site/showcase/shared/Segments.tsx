import styles from './Segments.module.css'

interface Props {
  /**
   * The digits to show, padded with spaces to the width of the display, so
   * the unlit segments stay where they are.
   */
  value: string
  className?: string
}

/**
 * Digits on a seven-segment display: the lit segments over the faint, unlit
 * ones that a real display shows through.
 */
export function Segments({ value, className }: Props) {
  // In DSEG a space is narrower than a cell; `!` is the blank as wide as one.
  const lit = value.replaceAll(' ', '!')
  // `8` lights every segment of a cell. The point and the colon sit between
  // cells rather than in one.
  const unlit = lit.replace(/[^.:]/g, '8')
  return (
    <span className={[styles.display, className].filter(Boolean).join(' ')}>
      <span className={styles.unlit} aria-hidden>
        {unlit}
      </span>
      <span className={styles.lit} aria-label={value.trim()}>
        {lit}
      </span>
    </span>
  )
}
