import * as functions from '../src'

test('the public entry point exposes every runtime API group', () => {
  expect(functions).toMatchObject({
    stepValue: expect.any(Function),
    exponentialScale: expect.any(Object),
    noteName: expect.any(Function),
    noteAt: expect.any(Function),
    selectModifier: expect.any(Function),
    unitFormat: expect.any(Function),
    mod: expect.any(Function),
  })
})
