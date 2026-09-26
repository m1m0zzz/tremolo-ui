import { createLongPress } from '../../src/pointer/long-press'

function pointerEvent(type: string, pointerId = 1) {
  const event = new MouseEvent(type)
  Object.defineProperty(event, 'pointerId', { value: pointerId })
  return event
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function setup() {
  const onPress = vi.fn()
  const press = createLongPress({ onPress, delay: 100, interval: 20 })
  return { onPress, press }
}

test('fires on the press, then repeats after the delay', () => {
  const { onPress, press } = setup()
  press.start({ button: 0, pointerId: 1 })
  expect(onPress).toHaveBeenCalledTimes(1)

  vi.advanceTimersByTime(99)
  expect(onPress).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  expect(onPress).toHaveBeenCalledTimes(2)
  vi.advanceTimersByTime(40)
  expect(onPress).toHaveBeenCalledTimes(4)
  press.destroy()
})

test.each(['pointerup', 'pointercancel'])('%s ends the press', (type) => {
  const { onPress, press } = setup()
  press.start({ button: 0, pointerId: 1 })
  window.dispatchEvent(pointerEvent(type))
  vi.advanceTimersByTime(200)
  expect(onPress).toHaveBeenCalledTimes(1)
  expect(press.pressed()).toBe(false)
})

test('the window losing focus ends the press', () => {
  const { onPress, press } = setup()
  press.start()
  window.dispatchEvent(new Event('blur'))
  vi.advanceTimersByTime(200)
  expect(onPress).toHaveBeenCalledTimes(1)
})

test('only the pointer that started the press ends it', () => {
  const { onPress, press } = setup()
  press.start({ button: 0, pointerId: 1 })
  window.dispatchEvent(pointerEvent('pointerup', 2))
  expect(press.pressed()).toBe(true)
  window.dispatchEvent(pointerEvent('pointerup', 1))
  expect(press.pressed()).toBe(false)
  expect(onPress).toHaveBeenCalledTimes(1)
})

test('only the primary button starts a press, and only once', () => {
  const { onPress, press } = setup()
  press.start({ button: 1, pointerId: 1 })
  expect(onPress).not.toHaveBeenCalled()
  press.start({ button: 0, pointerId: 1 })
  press.start({ button: 0, pointerId: 2 })
  expect(onPress).toHaveBeenCalledTimes(1)
  press.destroy()
})

test('update changes the timing of the press in progress', () => {
  const { onPress, press } = setup()
  press.start()
  vi.advanceTimersByTime(100)
  press.update({ interval: 50 })
  // The repeat already scheduled keeps its time; the next one uses the new.
  vi.advanceTimersByTime(20)
  expect(onPress).toHaveBeenCalledTimes(3)
  vi.advanceTimersByTime(49)
  expect(onPress).toHaveBeenCalledTimes(3)
  vi.advanceTimersByTime(1)
  expect(onPress).toHaveBeenCalledTimes(4)
  press.destroy()
})

test('stops listening once the press is over', () => {
  const remove = vi.spyOn(window, 'removeEventListener')
  const { press } = setup()
  press.start()
  press.stop()
  expect(remove).toHaveBeenCalledWith('blur', expect.any(Function))
  remove.mockRestore()
})
