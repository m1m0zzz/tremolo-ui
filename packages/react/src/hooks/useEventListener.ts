import { useCallback, useEffect, useRef } from 'react'

import { useCallbackRef } from './_internal/useCallbackRef'

/**
 * What {@link useEventListener} listens on. A function is called after every
 * render, so it can return an element out of a ref; `null` listens on nothing.
 */
export type UseEventListenerTarget =
  | EventTarget
  | null
  | (() => EventTarget | null)

/**
 * The options of `addEventListener`, as a boolean for `capture` or as an
 * object. `signal` is left out: the hook already owns when the listener goes.
 */
export type UseEventListenerOptions =
  | boolean
  | Pick<AddEventListenerOptions, 'capture' | 'once' | 'passive'>

interface Registration {
  node: EventTarget
  event: string
  capture: boolean
  once: boolean | undefined
  passive: boolean | undefined
  remove: VoidFunction
}

/**
 * Listen to an event on a target for as long as the component is mounted.
 *
 * The handler is read on every event, and the target and the options are
 * compared by what they resolve to, so all three can be written inline. The
 * listener is re-attached only when the element, the event or one of the
 * options actually changes.
 *
 * @returns a function that removes the listener. It stays removed until the
 * target, the event or the options change.
 */
export function useEventListener<K extends keyof DocumentEventMap>(
  target: UseEventListenerTarget,
  event: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: UseEventListenerOptions,
): VoidFunction
export function useEventListener<K extends keyof WindowEventMap>(
  target: UseEventListenerTarget,
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: UseEventListenerOptions,
): VoidFunction
export function useEventListener<K extends keyof GlobalEventHandlersEventMap>(
  target: UseEventListenerTarget,
  event: K,
  handler: (event: GlobalEventHandlersEventMap[K]) => void,
  options?: UseEventListenerOptions,
): VoidFunction
export function useEventListener(
  target: UseEventListenerTarget,
  event: string,
  handler: (event: Event) => void,
  options?: UseEventListenerOptions,
) {
  const listener = useCallbackRef(handler)
  const registrationRef = useRef<Registration | null>(null)

  const {
    capture = false,
    once,
    passive,
  } = typeof options === 'boolean' ? { capture: options } : (options ?? {})

  // No dependency list: an inline target or options object is a new value on
  // every render, so what decides a re-attach is the comparison below, not
  // their identity.
  useEffect(() => {
    const node = typeof target === 'function' ? target() : target
    const current = registrationRef.current

    if (
      current &&
      current.node === node &&
      current.event === event &&
      current.capture === capture &&
      current.once === once &&
      current.passive === passive
    ) {
      return
    }

    current?.remove()
    registrationRef.current = null
    if (!node) return

    const listenerOptions = { capture, once, passive }
    node.addEventListener(event, listener, listenerOptions)
    registrationRef.current = {
      node,
      event,
      capture,
      once,
      passive,
      remove: () => node.removeEventListener(event, listener, listenerOptions),
    }
  })

  useEffect(
    () => () => {
      registrationRef.current?.remove()
      registrationRef.current = null
    },
    [],
  )

  // Kept registered, so a render with the same target does not attach again.
  return useCallback(() => {
    const current = registrationRef.current
    if (!current) return
    current.remove()
    current.remove = () => {}
  }, [])
}
