import { ComponentProps, ElementType, ReactNode } from 'react'

import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'
import { composeRefs } from '../_util/composeRefs'
import { Override } from '../_util/type'

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

/**
 * @category WheelObserver
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
export function WheelObserver<T extends ElementType = 'div'>(
  props: Override<WheelObserverProps<T>, ComponentProps<T>>,
) {
  const { as: Component = 'div', children, onWheel, ref, ...attributes } = props

  const wheelRefCallback = useRefCallbackEvent(
    'wheel',
    (event) => {
      if (onWheel) onWheel(event)
    },
    { passive: false },
    [onWheel],
  )

  return (
    <Component ref={composeRefs(ref, wheelRefCallback)} {...attributes}>
      {children}
    </Component>
  )
}
