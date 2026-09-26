import {
  arrowKeyDirection,
  arrowKeyMove,
  isArrowKey,
  wheelDirection,
  wheelMove,
} from '../../src/input/direction'

const wheel = (deltaX: number, deltaY: number, shiftKey = false) => ({
  deltaX,
  deltaY,
  shiftKey,
})

test('isArrowKey', () => {
  expect(isArrowKey('ArrowUp')).toBe(true)
  expect(isArrowKey('Enter')).toBe(false)
})

describe('one value', () => {
  test('right and up raise it', () => {
    expect(arrowKeyDirection('ArrowRight')).toBe(1)
    expect(arrowKeyDirection('ArrowUp')).toBe(1)
    expect(arrowKeyDirection('ArrowLeft')).toBe(-1)
    expect(arrowKeyDirection('ArrowDown')).toBe(-1)
    expect(arrowKeyDirection('a')).toBeNull()
  })

  test('scrolling up raises it', () => {
    expect(wheelDirection(wheel(0, -100))).toBe(1)
    expect(wheelDirection(wheel(0, 100))).toBe(-1)
  })

  test('horizontal scrolling is ignored unless asked for', () => {
    expect(wheelDirection(wheel(100, 0))).toBeNull()
    expect(wheelDirection(wheel(100, 0), { horizontal: true })).toBe(1)
    expect(wheelDirection(wheel(-100, 0), { horizontal: true })).toBe(-1)
    // Vertical scrolling still counts without a horizontal movement.
    expect(wheelDirection(wheel(0, -100), { horizontal: true })).toBe(1)
  })

  test('horizontal movement wins over vertical when asked for', () => {
    expect(wheelDirection(wheel(100, 100), { horizontal: true })).toBe(1)
  })

  test('no movement moves nothing', () => {
    expect(wheelDirection(wheel(0, 0))).toBeNull()
  })
})

describe('a position on screen', () => {
  test('arrow keys move in screen coordinates', () => {
    expect(arrowKeyMove('ArrowRight')).toEqual({ axis: 0, direction: 1 })
    expect(arrowKeyMove('ArrowLeft')).toEqual({ axis: 0, direction: -1 })
    // y grows downwards.
    expect(arrowKeyMove('ArrowUp')).toEqual({ axis: 1, direction: -1 })
    expect(arrowKeyMove('ArrowDown')).toEqual({ axis: 1, direction: 1 })
    expect(arrowKeyMove('Tab')).toBeNull()
  })

  test('scrolling moves y', () => {
    expect(wheelMove(wheel(0, -100))).toEqual({ axis: 1, direction: -1 })
    expect(wheelMove(wheel(0, 100))).toEqual({ axis: 1, direction: 1 })
  })

  test('shift, or horizontal scrolling, moves x', () => {
    expect(wheelMove(wheel(0, 100, true))).toEqual({ axis: 0, direction: 1 })
    // What a browser actually sends for shift+wheel.
    expect(wheelMove(wheel(-100, 0, true))).toEqual({
      axis: 0,
      direction: -1,
    })
    expect(wheelMove(wheel(100, 0))).toEqual({ axis: 0, direction: 1 })
  })

  test('no movement moves nothing', () => {
    expect(wheelMove(wheel(0, 0, true))).toBeNull()
  })
})
