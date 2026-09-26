import { exponentialScale } from '@tremolo-ui/functions'

import { checkSteps } from '../../src/input/check-steps'

const range = { min: 0, max: 100, step: 1 }

test('nothing to say when every press moves the value', () => {
  expect(
    checkSteps({
      component: 'Slider',
      range,
      keyboard: { default: ['raw', 1], shift: ['raw', 0.1] },
      wheel: ['raw', 1],
    }),
  ).toEqual([])
})

test('a press finer than step', () => {
  const [warning, ...rest] = checkSteps({
    component: 'Slider',
    range,
    keyboard: ['raw', 0.1],
  })
  expect(rest).toEqual([])
  expect(warning).toContain('Slider: `keyboard` cannot move the value')
  expect(warning).toContain('`step` (1)')
})

test('names the axis', () => {
  const [warning] = checkSteps({
    component: 'XYPad',
    axis: 'y',
    range,
    wheel: ['raw', 0.1],
  })
  expect(warning).toContain('XYPad (y): `wheel`')
})

test('a display too coarse to show the press', () => {
  const [warning] = checkSteps({
    component: 'NumberInput',
    range: { min: 20, max: 20000, scale: exponentialScale },
    keyboard: ['raw', 1],
    format: (v) => `${(v / 1000).toFixed(0)} kHz`,
  })
  expect(warning).toContain('`format` shows the same text')
})

test('checks nothing without a travel to sample', () => {
  expect(
    checkSteps({ component: 'NumberInput', range: null, keyboard: ['raw', 0] }),
  ).toEqual([])
  expect(
    checkSteps({
      component: 'Slider',
      range: { min: 1, max: 1 },
      keyboard: ['raw', 0],
    }),
  ).toEqual([])
})
