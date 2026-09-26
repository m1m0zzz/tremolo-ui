---
'@tremolo-ui/react': patch
---

`NumberInput.InputField` no longer drops what is typed when it is given an
`onChange` of its own. The handler runs after the field has taken the text.
