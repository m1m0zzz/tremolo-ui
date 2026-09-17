import { matchesAccept } from './accept'

/** What is in the air over the element. */
export interface DropZoneState {
  /** Files are being dragged over the element. */
  over: boolean
  /**
   * None of what is being dragged matches `accept`, as far as can be told
   * before the drop.
   *
   * The browser reports the type of what is being dragged but withholds the
   * name, so a rule written as an extension cannot be decided yet and is not
   * counted against the drag. It is decided on the drop, where the name is.
   */
  invalid: boolean
}

export interface DropZoneOptions {
  /**
   * Which files to take, written the way the `accept` attribute of a file
   * input is: a comma separated list of extensions (`.wav`), MIME types
   * (`audio/wav`) and type groups (`audio/*`).
   */
  accept?: string
  /**
   * Take more than one file from a single drop. With it off, only the first
   * accepted file is reported, as a file input without `multiple` does.
   *
   * @default false
   */
  multiple?: boolean
  /**
   * Refuse the drop. The drag is still swallowed rather than let through: an
   * unhandled drop makes the browser leave the page and open the file.
   *
   * @default false
   */
  disabled?: boolean

  /** Called with the dropped files that match `accept`. */
  onDrop?: (files: File[], event: DragEvent) => void
  /**
   * Called with the dropped files that do not match `accept`, so that the
   * reason can be shown.
   */
  onReject?: (files: File[], event: DragEvent) => void
  /** Called whenever {@link DropZoneInstance.state} would change. */
  onStateChange?: (state: DropZoneState) => void
}

export interface DropZoneInstance {
  /** What is in the air over the element, right now. */
  readonly state: DropZoneState
  /** Replace the given options, keeping the listeners in place. */
  update: (options: DropZoneOptions) => void
  destroy: () => void
}

/**
 * Take files dropped onto an element.
 *
 * ```ts
 * const zone = createDropZone(element, {
 *   accept: 'audio/*',
 *   onDrop: (files) => load(files[0]),
 * })
 * ```
 *
 * The element needs no attribute of its own: a drop target is made by
 * cancelling `dragover`, which this does.
 */
export function createDropZone(
  element: Element,
  options: DropZoneOptions = {},
): DropZoneInstance {
  let opts = options
  let state: DropZoneState = { over: false, invalid: false }

  /**
   * `dragenter` and `dragleave` fire for descendants too, so moving between
   * two children of the zone leaves before it enters. Counting the pairs is
   * what keeps the state from flickering off in the middle of the element.
   */
  let depth = 0

  function setState(next: DropZoneState) {
    if (next.over === state.over && next.invalid === state.invalid) return
    state = next
    opts.onStateChange?.(state)
  }

  function carriesFiles(transfer: DataTransfer | null) {
    // `types` is the only thing that can be trusted during a drag; `files` is
    // empty until the drop.
    return !!transfer?.types.includes('Files')
  }

  /** Whether anything being dragged could still be accepted. */
  function anyAcceptable(transfer: DataTransfer | null) {
    const items = Array.from(transfer?.items ?? []).filter(
      (item) => item.kind === 'file',
    )
    // Some browsers hand over no items at all, only the `Files` type. Nothing
    // is known, so nothing is refused.
    if (items.length === 0) return true
    return items.some((item) => matchesAccept({ type: item.type }, opts.accept))
  }

  function onDragEnter(event: DragEvent) {
    if (!carriesFiles(event.dataTransfer)) return
    // Cancelled as well as `dragover`: a target that only cancels one of the
    // two is not a drop target in every browser.
    event.preventDefault()
    depth += 1
    setState({ over: true, invalid: !anyAcceptable(event.dataTransfer) })
  }

  function onDragOver(event: DragEvent) {
    if (!carriesFiles(event.dataTransfer)) return
    event.preventDefault()
    if (event.dataTransfer) {
      // Decides the cursor the pointer shows, and whether a drop is offered.
      event.dataTransfer.dropEffect =
        opts.disabled || state.invalid ? 'none' : 'copy'
    }
    // A drag that began outside the document can arrive without a `dragenter`
    // the listener saw, so the state is settled here too.
    if (!state.over) {
      depth = Math.max(depth, 1)
      setState({ over: true, invalid: !anyAcceptable(event.dataTransfer) })
    }
  }

  function onDragLeave(event: DragEvent) {
    if (!carriesFiles(event.dataTransfer)) return
    depth = Math.max(0, depth - 1)
    if (depth === 0) setState({ over: false, invalid: false })
  }

  function onDrop(event: DragEvent) {
    if (!carriesFiles(event.dataTransfer)) return
    // Always cancelled, even while disabled: an unhandled drop makes the
    // browser leave the page and open the file.
    event.preventDefault()
    depth = 0
    setState({ over: false, invalid: false })
    if (opts.disabled) return

    const dropped = Array.from(event.dataTransfer?.files ?? [])
    const accepted: File[] = []
    const rejected: File[] = []
    for (const file of dropped) {
      if (matchesAccept(file, opts.accept)) accepted.push(file)
      else rejected.push(file)
    }

    if (rejected.length > 0) opts.onReject?.(rejected, event)
    const taken = opts.multiple ? accepted : accepted.slice(0, 1)
    if (taken.length > 0) opts.onDrop?.(taken, event)
  }

  /**
   * A drag that ends anywhere else — dropped on another element, cancelled
   * with Esc, taken out of the window — sends no `dragleave` here, and the
   * element would stay marked as a drop target for good.
   */
  function onDragEndAnywhere() {
    depth = 0
    setState({ over: false, invalid: false })
  }

  const handlers = {
    dragenter: onDragEnter,
    dragover: onDragOver,
    dragleave: onDragLeave,
    drop: onDrop,
  } as const

  for (const [type, handler] of Object.entries(handlers)) {
    element.addEventListener(type, handler as EventListener)
  }

  const doc = element.ownerDocument
  doc?.addEventListener('dragend', onDragEndAnywhere)
  doc?.addEventListener('drop', onDragEndAnywhere)

  return {
    get state() {
      return state
    },
    update: (next) => {
      opts = { ...opts, ...next }
    },
    destroy: () => {
      for (const [type, handler] of Object.entries(handlers)) {
        element.removeEventListener(type, handler as EventListener)
      }
      doc?.removeEventListener('dragend', onDragEndAnywhere)
      doc?.removeEventListener('drop', onDragEndAnywhere)
    },
  }
}
