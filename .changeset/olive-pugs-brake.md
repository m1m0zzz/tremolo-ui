---
'@tremolo-ui/react': minor
---

`NumberInput.InputField` takes `unformatOnFocus`. With it set, the field drops
whatever `format` put around the value while it has focus and shows the plain
number, so a field reading `1.23kHz` offers `1230` to type over.

The number shown is the value itself rather than the number inside the
formatted text — `1.23` would read back as 1.23 and lose a factor of a
thousand. That also stops a rounded display becoming the value: a field with
`digits: 0` showing `2Hz` for 1.6 now offers `1.6` for editing.

Off by default.
