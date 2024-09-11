export function styleHelper(property: string | number) {
  if (typeof property == 'number') {
    return `${property}px`
  } else {
    return property
  }
}

export function isEmpty(obj: object) {
  return Object.keys(obj).length == 0
}
