import { createContext } from 'react'

/**
 * The top-left corner of the stage a demo is shown on, where its transport
 * goes. Outside the showcase there is none, and the transport stays where the
 * demo puts it.
 */
export const StageCorner = /* @__PURE__ */ createContext<HTMLElement | null>(
  null,
)
