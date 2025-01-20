export function parse(code: string) {
  console.log('parse')
  const codeArray = code.split('\n')
  let expandZone = false
  const expanded = []
  const collapsed = []
  for (let i = 0; i < codeArray.length; i++) {
    const line = codeArray[i];
    console.log(line)
    if (/^\/\/\s*expand\s+begin/.test(line)) {
      expandZone = true
    } else if ((/^\/\/\s*expand\s+end/.test(line))) {
      expandZone = false
    } else {
      if (!expandZone) {
        collapsed.push(line)
      }
      expanded.push(line)
    }
  }
  return {
    expand: expanded.join('\n').trim(),
    collapse: collapsed.join('\n').trim()
  }
}
