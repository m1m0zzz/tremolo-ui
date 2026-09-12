---
'@tremolo-ui/react': minor
---

Replace the `type` prop of `Slider.MarksOption` with `mark` and `label`. `mark={false}` leaves the mark out, `label={null}` leaves the label out, and any other label — including an empty string — is drawn as given instead of falling back to the value. `Slider.Marks` takes the interval directly (`options="step"`, `options={25}`), with `options={{ per, mark, label }}` for a set without marks or without labels.
