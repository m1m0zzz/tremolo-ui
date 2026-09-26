---
'@tremolo-ui/dom': patch
'@tremolo-ui/react': patch
'@tremolo-ui/svelte': patch
'@tremolo-ui/vue': patch
---

`FileInput` and `DropZone` report the rejected files after the accepted ones
for the same selection or drop. A list of rejected files cleared in
`onChange` / `onDrop` and filled in `onReject` now shows what a mixed
selection left out, where it used to be cleared straight away.
