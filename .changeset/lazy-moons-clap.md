---
'@tremolo-ui/react': minor
'@tremolo-ui/dom': minor
---

**Shift makes a `Knob` drag count a tenth as much**, matching what it already
does on the arrow keys. `dragSensitivity` rebinds it, or takes a bare number to
use no modifier.

Pressing or releasing the key mid-drag does not disturb the value: the travel
so far is kept and the new sensitivity applies from the next movement. Holding
it before the pointer goes down applies it from the first pixel.

`relativeMapping` of `@tremolo-ui/dom` takes a `sensitivity` callback for this,
read on every move. `selectModifier` of `@tremolo-ui/functions` resolves any
per-modifier setting, not just an input amount.
