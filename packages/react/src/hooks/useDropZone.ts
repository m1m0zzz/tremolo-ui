import { useEffect, useRef, useState } from 'react'

import {
  createDropZone,
  type DropZoneInstance,
  type DropZoneOptions,
} from '@tremolo-ui/dom'

import { useCallbackRef } from './_internal/useCallbackRef'

// `onStateChange` is left out: what it reports comes back from the hook as
// `over` and `invalid`, which is what a component renders from.
export interface UseDropZoneOptions extends Omit<
  DropZoneOptions,
  'onStateChange'
> {}

/**
 * Take files dropped onto an element.
 *
 * Any element can become a drop target this way — a waveform display, a track
 * lane, a canvas — without wrapping it in anything.
 *
 * @returns a ref callback for the element, and whether a drag is over it
 */
export function useDropZone<T extends Element>({
  accept,
  multiple,
  disabled,
  onDrop,
  onReject,
}: UseDropZoneOptions = {}): {
  refCallback: (node: T | null) => void
  over: boolean
  invalid: boolean
} {
  const dropHandler = useCallbackRef(onDrop)
  const rejectHandler = useCallbackRef(onReject)

  const [state, setState] = useState({ over: false, invalid: false })

  // See useDrag for why the node is held in state.
  const [node, setNode] = useState<T | null>(null)

  const instanceRef = useRef<DropZoneInstance | null>(null)

  // Read when the instance is created. The effect below keeps it current, and
  // runs right after, so a stale setting is replaced within the same commit.
  const latest = useRef({ accept, multiple, disabled })

  useEffect(() => {
    if (!node) return

    const instance = createDropZone(node, {
      ...latest.current,
      onDrop: (files, event) => dropHandler(files, event),
      onReject: (files, event) => rejectHandler(files, event),
      onStateChange: (next) => setState(next),
    })
    instanceRef.current = instance

    return () => {
      instanceRef.current = null
      instance.destroy()
      // The listeners are gone, so no `dragleave` is coming to clear this.
      setState({ over: false, invalid: false })
    }
  }, [node, dropHandler, rejectHandler])

  // Runs after every render: the settings come from props and are cheap to
  // push, and updating in place leaves a drag in progress untouched.
  useEffect(() => {
    latest.current = { accept, multiple, disabled }
    instanceRef.current?.update({ accept, multiple, disabled })
  })

  return { refCallback: setNode, over: state.over, invalid: state.invalid }
}
