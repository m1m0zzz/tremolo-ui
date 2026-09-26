import { cssLength } from '../src/style'

test('cssLength gives a bare number a unit', () => {
  expect(cssLength(50)).toBe('50px')
  expect(cssLength(0)).toBe('0px')
})

test('cssLength passes a string and undefined through', () => {
  expect(cssLength('3rem')).toBe('3rem')
  expect(cssLength('100%')).toBe('100%')
  expect(cssLength(undefined)).toBeUndefined()
})
