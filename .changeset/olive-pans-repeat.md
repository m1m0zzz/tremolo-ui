---
'@tremolo-ui/react': minor
---

`NumberInput.InputField` takes `keepCaretOnStep`, which puts the caret back
where it was after an arrow key steps the value. Without it a controlled input
drops the caret at the end, so holding the key down always acts on the last
digit and a column cannot be held.

The position is measured from the decimal point, so it survives the number
changing length: the caret between `9` and `.9` is still between `10` and `.0`.

Arrow keys no longer step the value while an IME is converting, where they
belong to the candidate list.
