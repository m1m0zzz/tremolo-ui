---
'@tremolo-ui/functions': minor
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

Replace `skew` with `scale`, and add scales that do not break down at the ends of the range

**Breaking.** The `skew` prop of `Slider.Root`, `Knob.Root` and `XYPad.Root`, and `AxisOptions.skew` in `@tremolo-ui/dom`, are replaced by `scale`, which takes a `Scale` from `@tremolo-ui/functions`.

```diff
-<Knob.Root min={20} max={22000} skew={skewWithCenterValue(663, 20, 22000)} …>
+<Knob.Root min={20} max={22000} scale={exponentialScale} …>
```

`@tremolo-ui/functions` gains the `Scale` interface and five scales:

- `linearScale` — the default. Equal travel, equal change in value
- `exponentialScale` — equal travel, equal *ratio*: every octave takes the same distance. For frequency, free running rates and delay times. Requires `min` and `max` to be non-zero and of the same sign
- `curveScale(curve)` — an exponential bend that still passes through `min` and `max`, so it works on a range that starts at or crosses 0. `curve > 0` favours the lower end, `curve < 0` the upper end. Pair it with `curveWithCenterValue()`
- `symmetricSkewScale(skew)` — the same bend mirrored about the middle, for a bipolar control that needs fine adjustment around its centre
- `skewScale(skew)` — the power law of JUCE's `NormalisableRange`, for a value that has to agree with a JUCE or iPlug2 parameter. `skewWithCenterValue()` still applies to it

A `Scale` takes `min` and `max` as arguments rather than holding them, so it carries no state and can be a module level constant.

This fixes the value jumping on a knob with a logarithmic scale. The power law is applied to `value - min`, so its slope at `min` is either infinite or zero: a dB knob over `-60..6` moved 12% of its range on the first pixel of a drag, and a frequency knob over `20..22000` did not move at all for the first 12 pixels. `exponentialScale` and `curveScale` have neither problem. `skewScale` still behaves this way, since matching JUCE is the point of it.
