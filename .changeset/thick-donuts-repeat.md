---
'@tremolo-ui/react': minor
---

`@tremolo-ui/react/styles/global.css` is removed, along with the
`.tremolo-user-select-none` and `.tremolo-cursor-*` classes it held.

Nothing has to be done to keep the same behaviour: the page-wide
`user-select: none` a drag applies is now an inline style set by the component,
so it works without any stylesheet. The `.tremolo-cursor-*` classes had already
stopped being used — a dragged element takes its cursor from `createDrag`.
