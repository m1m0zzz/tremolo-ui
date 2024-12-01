import { gainToDb } from '@tremolo-ui/functions/math'

// ref. https://github.com/Tonejs/Tone.js/blob/d44ff079dfd718a7b410baaab3acc8658e54a090/Tone/component/analysis/Meter.ts

export function getRMS(data: Float32Array) {
  const totalSquared = data.reduce(
    (total, current) => total + current * current,
    0,
  )
  const rms = Math.sqrt(totalSquared / data.length)
  return gainToDb(rms)
}
