import { Popover as BasePopover } from '@base-ui/react/popover'
import { ReactNode } from 'react'
import { FiInfo } from 'react-icons/fi'

import styles from './styles.module.css'

interface Props {
  /**
   * The accessible name of the trigger. The trigger is an icon on its own, so
   * it has no text to take a name from.
   */
  label: string
  /** What the popover holds. */
  children: ReactNode
}

/**
 * An info icon that opens its content in a popover.
 *
 * It opens on a click and closes on Escape or a click outside, so it works by
 * touch as well — unlike a tooltip, which only answers to a pointer hovering
 * over it.
 */
export function Popover({ label, children }: Props) {
  return (
    <BasePopover.Root>
      <BasePopover.Trigger className={styles.trigger} aria-label={label}>
        <FiInfo aria-hidden />
      </BasePopover.Trigger>
      <BasePopover.Portal>
        <BasePopover.Positioner
          className={styles.positioner}
          side="top"
          sideOffset={6}
        >
          <BasePopover.Popup className={styles.popup}>
            <BasePopover.Arrow className={styles.arrow} />
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  )
}
