import { createWheel } from '../../src/pointer/wheel'

afterEach(() => {
  document.body.innerHTML = ''
})

function wheelEvent(deltaY: number) {
  // jsdom has no WheelEvent constructor in every version, so build it by hand.
  const event = new Event('wheel', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'deltaY', { value: deltaY })
  return event
}

describe('createWheel', () => {
  test('forwards wheel events', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const onWheel = jest.fn()
    createWheel(element, onWheel)

    element.dispatchEvent(wheelEvent(120))

    expect(onWheel).toHaveBeenCalledTimes(1)
    expect(onWheel.mock.calls[0][0].deltaY).toBe(120)
  })

  test('the handler can preventDefault, so the listener is not passive', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    createWheel(element, (event) => event.preventDefault())

    const event = wheelEvent(120)
    element.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  test('destroy removes the listener', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const onWheel = jest.fn()
    const instance = createWheel(element, onWheel)

    instance.destroy()
    element.dispatchEvent(wheelEvent(120))

    expect(onWheel).not.toHaveBeenCalled()
  })
})
