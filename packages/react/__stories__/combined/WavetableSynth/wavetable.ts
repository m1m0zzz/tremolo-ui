import { clamp, mod } from '@tremolo-ui/functions'

export function generateWaveWithFunction(
  sampleLength: number,
  fn: (t: number) => number,
) {
  const wave = []
  for (let i = 0; i < sampleLength; i++) {
    wave.push(fn(i / sampleLength))
  }
  return wave
}

export function sin(t: number) {
  return Math.sin(2 * Math.PI * t)
}

export function triangle(t: number) {
  t = mod(t, 1)
  if (t <= 0.25) {
    return 4 * t
  } else if (t <= 0.75) {
    return 2 - 4 * t
  } else {
    return -4 + 4 * t
  }
}

export function saw(t: number) {
  t = mod(t, 1)
  if (t <= 0.5) {
    return 2 * t
  } else {
    return -2 + 2 * t
  }
}

export function pulse(t: number) {
  t = mod(t, 1)
  return t <= 0.5 ? 1 : -1
}

export function basicShapesWave(t: number, pos = 0) {
  pos = clamp(pos, 0, 100)
  function middle(
    f1: (t: number) => number,
    f2: (t: number) => number,
    percent: number,
  ) {
    return f1(t) * (1 - percent) + f2(t) * percent
  }

  if (pos <= 33) {
    return middle(sin, triangle, pos / 33)
  } else if (pos <= 67) {
    return middle(triangle, saw, (pos - 33) / (67 - 33))
  } else {
    return middle(saw, pulse, (pos - 67) / (100 - 67))
  }
}

export function middleWave(wave1: number[], wave2: number[], percent: number) {
  if (wave1.length != wave2.length) throw new Error()
  const m = []
  for (let j = 0; j < wave1.length; j++) {
    m.push(wave1[j] * (1 - percent) + wave2[j] * percent)
  }
  return m
}
