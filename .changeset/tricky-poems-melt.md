---
'@tremolo-ui/functions': minor
---

**`styleHelper` is removed.** It turned a number into a pixel length, with an
optional bit of arithmetic — `styleHelper(10, '/', 2)` giving `'5px'`.

Nothing uses it any more. Its one caller was the border radius of
`Slider.Track`, which is `calc(var(--thickness) / 2)` in CSS now that the track
no longer paints itself from JavaScript.

Both of its cases are a line of their own:

```js
typeof value === 'number' ? `${value}px` : value
`calc(${value} / 2)`
```

It also got the string case wrong — `styleHelper('2rem', '/', 2)` returned
`calc(2rempx / 2)` — which is one more reason not to keep it.
