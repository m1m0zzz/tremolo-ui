---
'@tremolo-ui/react': minor
'@tremolo-ui/dom': minor
---

**`FileInput` is new.** It picks files and hands them over as `File`s; reading
them is yours.

```jsx
<FileInput.Root accept="audio/*" multiple onChange={(files) => load(files)}>
  <FileInput.Trigger>Choose audio</FileInput.Trigger>
</FileInput.Root>
```

- **`accept` is checked again on the way in.** The browser treats the attribute
  as a hint to the picker, which a person can switch to "All Files". What does
  not match arrives at `onReject` rather than `onChange`
- **Picking the same file twice works.** A file input fires no `change` event
  while the selection is unchanged, so the value is cleared as soon as it has
  been read
- The native `<input type="file">` is still the control: out of sight, in the
  tab order, and named by `FileInput.Trigger`, which is a `<label>` for it

`matchesAccept` is new in `@tremolo-ui/dom`. It answers whether a file
satisfies an `accept` attribute, with the same extension, MIME type and type
group syntax the attribute has.

The demo theme has a `FileInput.module.css` to go with it.
