---
'@tremolo-ui/react': minor
---

State that is on or off is now written as an empty attribute: `data-disabled=""` rather than `data-disabled="true"`. The attributes affected are `data-disabled`, `data-readonly`, `data-dragging`, `data-selected`, `data-out-of-range`, `data-flipped`, `data-resizable` and a key's `data-active`. Attributes that carry a value, such as `data-orientation` and `data-note`, are unchanged.

Selecting on the attribute alone — `[data-disabled]`, which is what the docs and the demo theme have always used — keeps working. A selector that matches the value, `[data-disabled="true"]`, no longer matches.
