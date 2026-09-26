import { visuallyHiddenStyle } from '@tremolo-ui/dom'

/** A style object as the text of a `style` attribute. */
export function styleText(style: Record<string, string>): string {
  return Object.entries(style)
    .map(
      ([key, value]) =>
        `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value}`,
    )
    .join('; ')
}

/** `visuallyHiddenStyle` from the core, as a `style` attribute. */
export const visuallyHidden = /* @__PURE__ */ styleText(visuallyHiddenStyle)
