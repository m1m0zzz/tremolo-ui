import { replaceOptions } from '../../src/options/replace'

test('clears what the new options leave out', () => {
  const onDrag = () => {}
  expect(replaceOptions({ onDrag, threshold: 3 }, { threshold: 1 })).toEqual({
    onDrag: undefined,
    threshold: 1,
  })
})

test('clears everything when there are no new options', () => {
  expect(replaceOptions({ cursor: 'grab' }, undefined)).toEqual({
    cursor: undefined,
  })
})

test('passes the new options through when there were none before', () => {
  expect(replaceOptions(undefined, { cursor: 'grab' })).toEqual({
    cursor: 'grab',
  })
})
