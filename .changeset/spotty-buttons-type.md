---
'@tremolo-ui/functions': minor
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

Rebuild `NumberInput` on the compound pattern the other components already use, and give it one piece of state: the text being typed.

The value is a `number`, and what the input shows is `format(value)` — except while the user is typing, when their own text stands until it is committed. Everything else is derived during render. The `<input>` is no longer rendered for you; compose it as `NumberInput.InputField`, the way `Slider.Track` is composed.

```jsx
<NumberInput.Root value={value} min={0} max={100} units="Hz" onChange={setValue}>
  <NumberInput.InputField />
  <NumberInput.Stepper>
    <NumberInput.IncrementStepper />
    <NumberInput.DecrementStepper />
  </NumberInput.Stepper>
</NumberInput.Root>
```

Keeping the typed text rather than reformatting it on every keystroke removes the cursor-position restoring that used to be needed, and lets a value be entered digit by digit: typing is never clamped, and the entry is brought into range when it is committed on blur or Enter.

Breaking changes to `NumberInput`:

- `children` is required, and `InputField` has to be composed in. There is no default markup to fall back to
- `value` is a `number`; a `string` is no longer accepted
- `onChange` reports `(value: number)` rather than `(value, text)`
- `variant`, `activeColor` and `wrapperClassName` are gone. `Root` is the wrapper, so its `className` styles it, and the colors are CSS variables. The four variants are shown in the documentation as CSS to copy
- `keepWithinRange` and `clampValueOnBlur` are one `clampValue` prop (default `true`)
- `selectWithFocus` and `blurOnEnter` moved to `InputField`, as `selectOnFocus` and `blurOnEnter`. Its `onFocus` / `onBlur` are plain DOM handlers
- `Stepper` lost `dynamic`, and the steppers lost `size`: both are styling, now the `--stepper-icon-size` variable and the demo CSS
- the class names follow the parts: `tremolo-number-input` is the root and `tremolo-number-input-field` the input, where the root used to be `tremolo-number-input-wrapper`
- `data-error` is `data-out-of-range`

New in `NumberInput`: `skew`, `format` / `parse` for text the units cannot express, and dragging the `Stepper` up and down to move the value, one `step` every `drag` pixels (1 by default). It needs no range to work against, so an unbounded input can be dragged too.

The `<input>` is now the tab stop and carries the spinbutton role and range, where the wrapper used to take focus and the input was skipped.

Wheel control now only acts while the focus is inside the component, across `Slider`, `Knob`, `XYPad` and `NumberInput`. Reacting on hover alone took the scroll away from the page, so passing over a control while reading changed its value. `createWheel` gained a `requireFocus` option, and `update()`.

`@tremolo-ui/functions` gains `formatValue`, `parseValue`, `selectUnit` and the `Units` type, moved out of `@tremolo-ui/react` so that they are available to any wrapper.

It also gains `applyDelta`, which moves a value by one wheel notch or arrow key press. `Slider`, `Knob`, `XYPad` and `NumberInput` each had their own copy of this; they now share one, and `AxisOptions` of `@tremolo-ui/dom` extends its `ValueRange`, so a drag and a nudge describe their scaling the same way.

Fixes `NumberInput` throwing `"min" and "max" are required` from `wheel` or `keyboard` in `normalized` mode whenever `min` was `0`, which a truthiness check rejected.
