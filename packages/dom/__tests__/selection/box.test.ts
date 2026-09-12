import {
  createSelectionBox,
  selectionBoxCovers,
  type XY,
} from '../../src/index'

/** Four items, one in each quarter of the 0..1 space. */
const items: [string, XY<number>][] = [
  ['a', [0.2, 0.2]],
  ['b', [0.4, 0.4]],
  ['c', [0.9, 0.9]],
  ['d', [0.1, 0.9]],
]

function setup(entries: [string, XY<number>][] = items) {
  const onBoxChange = vi.fn()
  const onSelectionChange = vi.fn()
  const box = createSelectionBox<string>({
    items: () => entries,
    onBoxChange,
    onSelectionChange,
  })
  return { box, onBoxChange, onSelectionChange }
}

const selection = (mock: ReturnType<typeof vi.fn>) =>
  mock.mock.calls.at(-1)?.[0]

describe('selectionBoxCovers', () => {
  test('takes the edges as covered', () => {
    const rect = { x: 0.2, y: 0.2, width: 0.2, height: 0.2 }

    expect(selectionBoxCovers(rect, [0.3, 0.3])).toBe(true)
    expect(selectionBoxCovers(rect, [0.2, 0.4])).toBe(true)
    expect(selectionBoxCovers(rect, [0.2, 0.41])).toBe(false)
    expect(selectionBoxCovers(rect, [0.19, 0.3])).toBe(false)
  })
})

describe('createSelectionBox', () => {
  test('draws from the corner it started at, in either direction', () => {
    const { box, onBoxChange } = setup()

    box.begin([0.5, 0.5])
    expect(onBoxChange).toHaveBeenLastCalledWith({
      x: 0.5,
      y: 0.5,
      width: 0,
      height: 0,
    })

    box.move([0.2, 0.1])
    // The far corner went up and to the left, so the rect is measured from it.
    expect(box.box()).toStrictEqual({
      x: 0.2,
      y: 0.1,
      width: 0.3,
      height: 0.4,
    })
  })

  test('selects what it covers, and lets go of what it no longer covers', () => {
    const { box, onSelectionChange } = setup()

    box.begin([0, 0])
    box.move([0.5, 0.5])
    expect(selection(onSelectionChange)).toStrictEqual(['a', 'b'])

    box.move([0.3, 0.3])
    expect(selection(onSelectionChange)).toStrictEqual(['a'])
  })

  test('a plain press clears the selection before anything is covered', () => {
    const { box, onSelectionChange } = setup()

    box.begin([0.6, 0.1])
    expect(onSelectionChange).toHaveBeenLastCalledWith([])
  })

  test('additive keeps what was selected, without repeating it', () => {
    const { box, onSelectionChange } = setup()

    box.begin([0, 0], { additive: true, selection: ['c', 'a'] })
    // Nothing is cleared on the way in.
    expect(onSelectionChange).not.toHaveBeenCalled()

    box.move([0.5, 0.5])
    expect(selection(onSelectionChange)).toStrictEqual(['c', 'a', 'b'])
  })

  test('reads the items again on every move', () => {
    const entries: [string, XY<number>][] = [['a', [0.9, 0.9]]]
    const { box, onSelectionChange } = setup(entries)

    box.begin([0, 0])
    box.move([0.5, 0.5])
    expect(selection(onSelectionChange)).toStrictEqual([])

    // The item moved under the box between the two moves.
    entries[0] = ['a', [0.1, 0.1]]
    box.move([0.5, 0.5])
    expect(selection(onSelectionChange)).toStrictEqual(['a'])
  })

  test('end reports whether a box was running, and takes it away', () => {
    const { box, onBoxChange } = setup()

    expect(box.end()).toBe(false)

    box.begin([0, 0])
    box.move([0.5, 0.5])
    expect(box.end()).toBe(true)
    expect(box.box()).toBeNull()
    expect(onBoxChange).toHaveBeenLastCalledWith(null)

    // Moving after the end does nothing: the drag is over.
    box.move([0.9, 0.9])
    expect(box.box()).toBeNull()
  })

  test('update swaps the callbacks without interrupting the box', () => {
    const { box } = setup()
    const onSelectionChange = vi.fn()

    box.begin([0, 0])
    box.update({ onSelectionChange })
    box.move([0.5, 0.5])

    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b'])
  })

  test('destroy leaves nothing running', () => {
    const { box, onSelectionChange } = setup()

    box.begin([0, 0])
    box.destroy()
    onSelectionChange.mockClear()
    box.move([0.5, 0.5])

    expect(box.box()).toBeNull()
    expect(onSelectionChange).not.toHaveBeenCalled()
  })
})
