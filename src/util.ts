export function styleHelper(property: string | number) {
  if (typeof property == 'number') {
    return `${property}px`
  } else {
    return property
  }
}
