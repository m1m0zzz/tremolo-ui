export function addUserSelectNone() {
  window.document.body.classList.add('tremolo-user-select-none')
}

export function removeUserSelectNone() {
  window.document.body.classList.remove('tremolo-user-select-none')
}

const cursorStyles = {
  grabbing: 'tremolo-cursor-grabbing',
  grab: 'tremolo-cursor-grab',
  pointer: 'tremolo-cursor-pointer',
  move: 'tremolo-cursor-move',
  none: 'tremolo-cursor-none',
}

export type Cursor = keyof typeof cursorStyles

export function setCursorStyle(type: Cursor) {
  resetCursorStyle()
  window.document.body.classList.add(cursorStyles[type])
}

export function resetCursorStyle() {
  Object.values(cursorStyles).forEach((s) => {
    window.document.body.classList.remove(s)
  })
}
