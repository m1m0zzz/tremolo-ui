---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

**Shift now makes a `Slider`, `XYPad` or `PointsEditor` drag fine, the way it
already did on `Knob`.** All four take `dragSensitivity`, default
`{ default: 1, shift: 0.1 }`, and a bare number opts out of modifiers.

These three are different from `Knob`: their value is the position pointed at,
so a fine drag cannot stay under the pointer. It moves a tenth as fast and the
two drift apart — and they stay apart once the key is released. Snapping the
value back under the pointer would move it by however far they had drifted,
which is a jump nobody asked for.

Pressing or releasing the key partway through does not disturb the value, and a
plain click still lands where it was aimed.

`elementMapping` of `@tremolo-ui/dom` takes the same `sensitivity` callback
`relativeMapping` does:

```ts
elementMapping(() => track, {
  sensitivity: (state) => (state.event.shiftKey ? 0.1 : 1),
})
```

It reports `origin + (position - anchor) * sensitivity`, where origin and
anchor only move when the sensitivity does. With no callback the two never
part, so the result is the raw position and nothing changes.
