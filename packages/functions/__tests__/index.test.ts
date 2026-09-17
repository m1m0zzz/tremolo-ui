import * as functions from '../src'

test('the public entry point exposes every runtime API group', () => {
  expect(functions).toMatchObject({
    stepValue: expect.any(Function),
    exponentialScale: expect.any(Object),
    noteName: expect.any(Function),
    unitFormat: expect.any(Function),
    toPrecision: expect.any(Function),
  })
})
