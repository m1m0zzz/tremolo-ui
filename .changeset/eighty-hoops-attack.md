---
'@tremolo-ui/react': minor
---

Rename `Slider.Scale` to `Slider.Marks`

**Breaking.** `scale` is now the prop that says how a value is distributed across the travel, so the subcomponent that draws the tick marks needed a name of its own — `<Slider.Root scale={…}><Slider.Scale/></Slider.Root>` read as though the two were related.

```diff
-<Slider.Scale>
-  <Slider.ScaleOption value={0} type="mark-number" />
-</Slider.Scale>
+<Slider.Marks>
+  <Slider.MarksOption value={0} type="mark-number" />
+</Slider.Marks>
```

| before | after |
| --- | --- |
| `Slider.Scale` | `Slider.Marks` |
| `Slider.ScaleOption` | `Slider.MarksOption` |
| `ScaleProps` | `MarksProps` |
| `ScaleOptionProps` | `MarksOptionProps` |
| `ScaleOptions` | `MarksOptions` |
| `ScaleType` | `MarksType` |
| `.tremolo-slider-scale` | `.tremolo-slider-marks` |
| `.tremolo-slider-scale-option` | `.tremolo-slider-marks-option` |
| `.tremolo-slider-scale-option-mark` | `.tremolo-slider-marks-option-mark` |
| `.tremolo-slider-scale-option-label` | `.tremolo-slider-marks-option-label` |

The `options` prop and its behaviour are unchanged, and `@tremolo-ui/react/styles/Slider.css` still exports the same file.
