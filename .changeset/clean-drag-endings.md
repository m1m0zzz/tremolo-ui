---
'@tremolo-ui/dom': patch
'@tremolo-ui/react': patch
---

End every active drag when its instance is destroyed or its pointer capture is
lost. These paths use the existing `onDragEnd` callback, as cleanup is required
after every drag that started regardless of how the pointer stopped tracking.

React controls now balance the page-wide `user-select: none` they acquire even
when they unmount or become readonly during a drag.
