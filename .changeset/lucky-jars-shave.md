---
'@tremolo-ui/react': minor
---

**`@tremolo-ui/react` no longer ships any CSS.** The `./styles/*.css` export
paths are gone, `dist/index.css` is no longer built, and importing either one
now fails to resolve.

Components still render the same `tremolo-` class names and the same
`aria-*` / `data-*` state attributes, so the appearance is a stylesheet away —
it just has to be yours. The theme the documentation uses is published at
[Styling](https://tremolo-ui.vercel.app/docs/tutorials/styling) as six plain
CSS files to copy from.

```diff
- import '@tremolo-ui/react/styles/index.css'
+ import './tremolo-theme.css' // copied from the Styling page
```
