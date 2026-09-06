---
'@tremolo-ui/react': patch
---

**Importing one component now brings only that component.** Tree shaking was
not working at all: a build that used nothing but `Knob` still carried Piano,
Slider, XYPad, NumberInput and PointsEditor. Bundled with esbuild, that came
to 32,362 bytes against 39,113 for importing the whole package.

The cause was `forwardRef(...)` and `createContext(...)` being plain
module-level calls. A bundler has to assume a call might have side effects, so
`const Knob = { Root: forwardRef(...) }` survives even when `Knob` is unused.
Both are pure, and are now annotated as such.

| import | before | after |
| --- | --- | --- |
| `Knob` | 32,362 | **11,567** |
| `Slider` | — | 12,518 |
| `NumberInput` | — | 10,498 |
| `Piano` | — | 7,866 |
| everything | 39,113 | 39,113 |

`clsx` is no longer a dependency. Every call in the package was
`clsx('tremolo-x', className)` — a constant name plus the caller's own — with
no object, array or nesting anywhere, so it is a one-line function now.
`@tremolo-ui/react` depends on nothing but `@tremolo-ui/dom` and
`@tremolo-ui/functions`.

`sideEffects` is `false` rather than `["*.css"]`, which pointed at files the
package stopped shipping when the CSS was removed.
