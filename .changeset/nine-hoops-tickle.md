---
'@tremolo-ui/functions': minor
---

`wheel` and `keyboard` amounts can now name a modifier key.

```tsx
keyboard={{ default: ['raw', 1], shift: ['raw', 0.1] }}
```

`InputEventOptions` accepts either the old tuple or a map with a `default` and
any of `shift` / `alt` / `ctrl` / `meta`. `selectInputEvent` resolves one
against an event, and `applyDelta` takes the event as a fifth argument.

**A modifier entry is not snapped to `step`.** Naming one is a deliberate
request to move off the grid, and without the carve-out a finer amount would
round straight back to where it started.
