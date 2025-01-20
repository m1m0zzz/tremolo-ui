export function parse(code: string) {
  const codeArray = code.split('\n')
  let expandZone = false
  let expandAltZone = false
  const executed = []
  const expanded = []
  const collapsed = []
  for (let i = 0; i < codeArray.length; i++) {
    const line = codeArray[i];
    // console.log(line)
    const m = line.match(/^(\s*)\/\/\s*(.*)|^(\s*)\{\/\*\s*(.*)\s*\*\/\}/)
    // console.log(m)
    const isComment = !!m
    const indent = m?.[1] || m?.[3] || ''
    const magicComment = (m?.[2] || m?.[4])?.trim()
    const isSlashComment = !!m?.[2]
    
    if (magicComment == 'expand begin') {
      expandZone = true
    // } else if (magicComment == 'expand alt') {
      // expandAltZone = true
    } else if (magicComment == 'expand end') {
      expandZone = false
      expandAltZone = false
    } else {
      // if (expandAltZone) {
      //   if (isComment) {
      //     if (magicComment?.startsWith("\\")) {
      //       const content = magicComment?.replace(/^\\/, '') || ''
      //       const fmt = isSlashComment ? `// ${content}` : `{/* ${content} */}`
      //       collapsed.push(indent + fmt)
      //     } else {
      //       collapsed.push(indent + magicComment)
      //     }
      //   } else {
      //     expanded.push(line)
      //     executed.push(line)
      //   }
      //   continue
      // }

      if (!expandZone) {
        collapsed.push(line)
        executed.push(line)
      }
      expanded.push(line)
    }
  }
  return {
    exec: executed.join('\n').trim(),
    expand: expanded.join('\n').trim(),
    collapse: collapsed.join('\n').trim()
  }
}
