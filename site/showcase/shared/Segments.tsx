import styles from './Segments.module.css'

interface Props {
  /** The digits to show. They are right-aligned on the display. */
  value: string
  /**
   * The cells of the display, every segment lit, as `888.8`: it is drawn
   * faint behind the value, and fixes the width whatever the value is.
   */
  layout: string
  className?: string
}

/** The point and the colon sit between cells, and take no room of their own. */
const cells = (text: string) => text.replace(/[.:]/g, '').length

/**
 * Digits on a seven-segment display: the lit segments over the faint, unlit
 * ones that a real display shows through.
 */
export function Segments({ value, layout, className }: Props) {
  // Padded by cells rather than characters, with `!`: in DSEG it is the blank
  // as wide as a digit, where a space is narrower.
  const lit = '!'.repeat(Math.max(0, cells(layout) - cells(value))) + value
  return (
    <span className={[styles.display, className].filter(Boolean).join(' ')}>
      <span className={styles.unlit} aria-hidden>
        {layout}
      </span>
      <span className={styles.lit} aria-label={value}>
        {lit}
      </span>
    </span>
  )
}
