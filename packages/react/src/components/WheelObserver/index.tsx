import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'

/**
 * @example
 * <WheelObserver
 *   onWheel={(event) => {
 *     event.preventDefault()
 *     console.log(event.deltaY)
 *   }
 * >
 *   <div>Wheel here</div>
 * </WheelObserver>
 */

/** @category WheelObserver */
export interface WheelObserverProps<T extends ElementType> {
  /**
   * React.ElementType
   * @default div
   */
  as?: T

  children?: ReactNode
  onWheel?: (event: WheelEvent) => void
}

/** @category WheelObserver */
export function WheelObserver<T extends ElementType = 'div'>(
  props: WheelObserverProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof WheelObserverProps<T>>,
) {
  const { children, onWheel, as: Component = 'div', ...attributes } = props

  const wheelRefCallback = useRefCallbackEvent(
    'wheel',
    (event) => {
      if (onWheel) onWheel(event)
    },
    { passive: false },
    [onWheel],
  )

  return (
    <Component ref={wheelRefCallback} {...attributes}>
      {children}
    </Component>
  )
}
