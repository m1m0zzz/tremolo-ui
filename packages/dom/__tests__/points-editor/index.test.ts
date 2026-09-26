import {
  clampPoint,
  createPointsEditor,
  type PointPosition,
  type PointsEditorOptions,
} from '../../src/points-editor'

const NONE = { shiftKey: false, altKey: false, ctrlKey: false, metaKey: false }
const CTRL = { ...NONE, ctrlKey: true }

/** An editor with points a and b, whose values live in `values`. */
function setup(options: PointsEditorOptions = {}) {
  const values: Record<string, PointPosition> = {
    a: { x: 0.2, y: 0.5 },
    b: { x: 0.6, y: 0.5 },
  }
  const limits: Record<string, { max?: Partial<PointPosition> }> = {}
  const onSelectionChange = vi.fn((next: string[]) =>
    editor.update({ selection: next }),
  )
  const editor = createPointsEditor({ onSelectionChange, ...options })
  const elements: Record<string, HTMLElement> = {}
  for (const id of Object.keys(values)) {
    const element = document.createElement('div')
    element.tabIndex = -1
    document.body.appendChild(element)
    elements[id] = element
    editor.registerPoint(id, () => ({
      value: values[id],
      max: limits[id]?.max,
      element,
      wheel: ['normalized', 0.1],
      onChange: (v) => {
        values[id] = v
      },
    }))
  }
  return { editor, values, limits, elements, onSelectionChange }
}

afterEach(() => {
  document.body.replaceChildren()
})

test('clampPoint keeps a point within its range', () => {
  expect(clampPoint({ x: -1, y: 2 })).toEqual({ x: 0, y: 1 })
  expect(clampPoint({ x: 0.9, y: 0.1 }, { y: 0.2 }, { x: 0.5 })).toEqual({
    x: 0.5,
    y: 0.2,
  })
})

describe('without selection', () => {
  test('a drag moves only the point it started on', () => {
    const { editor, values, onSelectionChange } = setup()
    editor.beginPointDrag('a', NONE)
    editor.movePointDrag({ x: 0.1, y: 0 })
    expect(values.a).toEqual({ x: 0.3, y: 0.5 })
    expect(values.b).toEqual({ x: 0.6, y: 0.5 })
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  test('the move is measured from where the drag started', () => {
    const { editor, values } = setup()
    editor.beginPointDrag('a', NONE)
    editor.movePointDrag({ x: 0.1, y: 0 })
    editor.movePointDrag({ x: 0.2, y: 0 })
    expect(values.a.x).toBe(0.4)
  })
})

describe('with selection', () => {
  test('a press selects the point', () => {
    const { editor, onSelectionChange } = setup({ selectable: true })
    editor.beginPointDrag('a', NONE)
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a'])
  })

  test('ctrl adds to the selection and takes out again', () => {
    const { editor, onSelectionChange } = setup({ selectable: true })
    editor.beginPointDrag('a', NONE)
    editor.beginPointDrag('b', CTRL)
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b'])
    editor.beginPointDrag('a', CTRL)
    expect(onSelectionChange).toHaveBeenLastCalledWith(['b'])
  })

  test('a drag on a selected point moves the whole selection', () => {
    const { editor, values } = setup({
      selectable: true,
      selection: ['a', 'b'],
    })
    editor.beginPointDrag('a', NONE)
    editor.movePointDrag({ x: 0.1, y: -0.1 })
    expect(values.a).toEqual({ x: 0.3, y: 0.4 })
    expect(values.b).toEqual({ x: 0.7, y: 0.4 })
  })

  test('the group stops together at the edge', () => {
    const { editor, values, limits } = setup({
      selectable: true,
      selection: ['a', 'b'],
    })
    limits.b = { max: { x: 0.7 } }
    editor.beginPointDrag('a', NONE)
    editor.movePointDrag({ x: 0.3, y: 0 })
    expect(values.a.x).toBe(0.3)
    expect(values.b.x).toBe(0.7)
  })

  test('a deselecting press drags nothing', () => {
    const { editor, values } = setup({
      selectable: true,
      selection: ['a', 'b'],
    })
    editor.beginPointDrag('a', CTRL)
    editor.movePointDrag({ x: 0.1, y: 0 })
    expect(values.a.x).toBe(0.2)
    expect(values.b.x).toBe(0.6)
  })

  test('a nudge moves the selection from where it is now', () => {
    const { editor, values } = setup({
      selectable: true,
      selection: ['a', 'b'],
    })
    editor.nudgePoint('b', 'y', -1, ['normalized', 0.1])
    expect(values.a.y).toBe(0.4)
    expect(values.b.y).toBe(0.4)
  })

  test('a selection box selects what it covers and focuses a point', () => {
    const onSelectionBoxChange = vi.fn()
    const { editor, elements, onSelectionChange } = setup({
      selectable: true,
      onSelectionBoxChange,
    })
    editor.beginSelectionBox({ x: 0.1, y: 0.4 }, NONE)
    editor.moveSelectionBox({ x: 0.3, y: 0.6 })
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a'])
    expect(onSelectionBoxChange).toHaveBeenCalled()
    editor.endSelectionBox()
    expect(onSelectionBoxChange).toHaveBeenLastCalledWith(null)
    expect(document.activeElement).toBe(elements.a)
  })

  test('turning selection off empties it', () => {
    const { editor, values } = setup({
      selectable: true,
      selection: ['a', 'b'],
    })
    editor.update({ selectable: false })
    editor.beginPointDrag('a', NONE)
    editor.movePointDrag({ x: 0.1, y: 0 })
    expect(values.b.x).toBe(0.6)
  })
})

test('the wheel moves the focused point with its own option', () => {
  const { editor, values, elements } = setup()
  expect(editor.nudgeFocusedPoint('x', 1, NONE)).toBe(false)
  elements.b.focus()
  expect(editor.nudgeFocusedPoint('x', 1, NONE)).toBe(true)
  expect(values.b.x).toBe(0.7)
})

test('isPointElement recognises a point and what is inside it', () => {
  const { editor, elements } = setup()
  const child = document.createElement('span')
  elements.a.appendChild(child)
  expect(editor.isPointElement(child)).toBe(true)
  expect(editor.isPointElement(document.body)).toBe(false)
})

test('an unregistered point is let go', () => {
  const editor = createPointsEditor()
  const onChange = vi.fn()
  const unregister = editor.registerPoint('a', () => ({
    value: { x: 0.5, y: 0.5 },
    onChange,
  }))
  unregister()
  editor.nudgeSelection('a', { x: 0.1, y: 0 })
  expect(onChange).not.toHaveBeenCalled()
})
