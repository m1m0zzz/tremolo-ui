import { useEffect } from 'react'

const SCRIPT_ID = 'tailwind-browser'
const CONFIG_ID = 'tailwind-config'

/**
 * Tailwind, for the pages that show an example written in it.
 *
 * The browser build generates the CSS from whatever classes are in the DOM, so
 * a class typed into a live example works as well as one we wrote. Preflight is
 * left out on purpose: it is a reset, and this page already has one of its own.
 *
 * `dark:` is pointed at the mark Docusaurus puts on `<html>`, since out of the
 * box it follows `prefers-color-scheme` and would ignore the theme toggle.
 *
 * Rendered by the page rather than loaded for the whole site — nothing else
 * needs it, and the script is a request of its own.
 */
export default function TailwindRuntime() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return

    // The layers Tailwind would import itself, minus `preflight`.
    const config = document.createElement('style')
    config.id = CONFIG_ID
    config.setAttribute('type', 'text/tailwindcss')
    config.textContent = [
      '@import "tailwindcss/theme" layer(theme);',
      '@import "tailwindcss/utilities" layer(utilities);',
      // `.dark` as well, so an example copied out of Storybook still flips.
      '@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *));',
    ].join('\n')
    document.head.append(config)

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4'
    document.head.append(script)
  }, [])

  return null
}
