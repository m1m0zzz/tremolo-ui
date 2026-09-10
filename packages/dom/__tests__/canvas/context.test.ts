import { drawingState, isDrawingState } from '../../src'
import { readDrawingState, writeDrawingState } from '../../src/canvas/context'

import { withContext2D } from './helpers'

describe('drawing state', () => {
  test('recognizes every public drawing state name', () => {
    for (const name of drawingState) {
      expect(isDrawingState(name)).toBe(true)
    }
    expect(isDrawingState('unknown')).toBe(false)
    expect(isDrawingState(1)).toBe(false)
    expect(isDrawingState(null)).toBe(false)
  })

  test('reads and writes properties, line dash, and transform', () => {
    const contexts = withContext2D()
    const source = contexts.get(document.createElement('canvas'))
    const target = contexts.get(document.createElement('canvas'))

    source.fillStyle = '#123456'
    source.globalAlpha = 0.4
    source.filter = 'blur(2px)'
    source.setLineDash([4, 2])
    source.setTransform(2, 0, 0, 3, 5, 7)

    const state = readDrawingState(source)
    source.setLineDash([1])
    writeDrawingState(target, state)

    expect(target.fillStyle).toBe('#123456')
    expect(target.globalAlpha).toBe(0.4)
    expect(target.filter).toBe('blur(2px)')
    expect(target.getLineDash()).toEqual([4, 2])
    expect(target.getTransform()).toMatchObject({
      a: 2,
      d: 3,
      e: 5,
      f: 7,
    })
  })
})
