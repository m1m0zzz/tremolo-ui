---
'@tremolo-ui/react': patch
---

**A development build now says when a key press or a wheel notch cannot do
anything visible.** Two settings that are each fine on their own can cancel
out, and nothing fails when they do — the control just sits there.

- `keyboard={['raw', 0.1]}` with `step={1}` rounds every press straight back
  to where it started
- a `format` showing two decimals of a value in seconds cannot show a press
  worth one millisecond

`Slider`, `Knob`, `XYPad` (per axis) and `NumberInput` press every entry of
`keyboard` and `wheel` at nine points along their range and report what came
of it. `format` is called rather than read, so an arbitrary function is no
obstacle: what matters is whether its output changes, not how many digits it
has.

A display that merely rounds is left alone — that is a deliberate choice and
usually the right one. Only a display too coarse to show a press *anywhere in
the range* is reported. Production builds carry neither the check nor the
messages.
