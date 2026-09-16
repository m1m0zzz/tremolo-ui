---
'@tremolo-ui/react': minor
'@tremolo-ui/dom': minor
---

**`DropZone` is new.** It takes files dropped onto an area and hands them over
as `File`s, stopping where `FileInput` does.

```jsx
<DropZone.Root accept="audio/*" onDrop={(files) => load(files[0])}>
  Drop an audio file here
</DropZone.Root>
```

- `[data-dragover]` while files are over it, and `[data-invalid]` when it can
  already tell it will not take them — the browser reports the type of what is
  being dragged, so `audio/*` decides before the drop while `.wav` cannot
- **Leaving a child does not end the drag.** `dragenter` and `dragleave` fire
  for descendants too, so the pairs are counted
- **The drop is cancelled even when it is refused.** An unhandled drop makes
  the browser leave the page and open the file
- A drag that ends elsewhere — dropped on another element, cancelled with
  Escape, taken out of the window — sends no `dragleave`, and is cleared anyway

**`useDropZone` is new**, and is what the component is built on. It makes any
element a drop target without wrapping it:

```jsx
const { refCallback, over, invalid } = useDropZone({ accept: 'audio/*', onDrop })
return <canvas ref={refCallback} />
```

**`createDropZone` is new in `@tremolo-ui/dom`**, where the reading of the drag
lives so that a wrapper for another framework uses the same one.

The demo theme has a `DropZone.module.css` to go with it.
