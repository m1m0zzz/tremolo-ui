import { render } from '@testing-library/react'

import { PointsEditor } from '../../src/components/PointsEditor'
import { Slider } from '../../src/components/Slider'
import { XYPad } from '../../src/components/XYPad'

/** The custom property, as it was written onto the element. */
const variable = (element: Element, name: string) =>
  (element as HTMLElement).style.getPropertyValue(name)

function renderSlider(
  props?: Partial<React.ComponentProps<typeof Slider.Root>>,
) {
  const { container } = render(
    <Slider.Root value={25} min={0} max={100} {...props}>
      <Slider.Track>
        <Slider.Thumb />
      </Slider.Track>
    </Slider.Root>,
  )
  return container.querySelector('.tremolo-slider-track')!
}

describe('appearance props write custom properties', () => {
  test('a number is written as pixels', () => {
    const { container } = render(
      <Slider.Root value={25} min={0} max={100}>
        <Slider.Track length={200} thickness={16}>
          <Slider.Thumb />
        </Slider.Track>
      </Slider.Root>,
    )
    const track = container.querySelector('.tremolo-slider-track')!

    expect(variable(track, '--length')).toBe('200px')
    expect(variable(track, '--thickness')).toBe('16px')
  })

  test('a string is written as given', () => {
    const { container } = render(
      <Slider.Root value={25} min={0} max={100}>
        <Slider.Track length="50%" thickness="0.5rem">
          <Slider.Thumb />
        </Slider.Track>
      </Slider.Root>,
    )
    const track = container.querySelector('.tremolo-slider-track')!

    expect(variable(track, '--length')).toBe('50%')
    expect(variable(track, '--thickness')).toBe('0.5rem')
  })

  test('an omitted prop leaves the property unset, so the CSS default stands', () => {
    const track = renderSlider()

    expect(variable(track, '--length')).toBe('')
    expect(variable(track, '--thickness')).toBe('')
    expect(variable(track, '--active')).toBe('')
  })

  test('the track publishes where the value sits', () => {
    expect(variable(renderSlider(), '--percent')).toBe('25%')
  })

  test('data-flipped says which end the value grows from', () => {
    expect(renderSlider().getAttribute('data-flipped')).toBe('false')
    expect(renderSlider({ vertical: true }).getAttribute('data-flipped')).toBe(
      'true',
    )
    expect(renderSlider({ reverse: true }).getAttribute('data-flipped')).toBe(
      'true',
    )
    // Both at once cancel out: the value grows the ordinary way again.
    expect(
      renderSlider({ vertical: true, reverse: true }).getAttribute(
        'data-flipped',
      ),
    ).toBe('false')
  })

  test('the track no longer paints itself', () => {
    // The fill is a rule in the theme now, drawn from `--percent`.
    expect((renderSlider() as HTMLElement).style.background).toBe('')
  })

  test('XYPad.Area', () => {
    const { container } = render(
      <XYPad.Root value={[0, 0]} min={[0, 0]} max={[10, 10]}>
        <XYPad.Area width={300} height="10rem" color="red">
          <XYPad.Thumb />
        </XYPad.Area>
      </XYPad.Root>,
    )
    const area = container.querySelector('.tremolo-xy-pad-area')!

    expect(variable(area, '--width')).toBe('300px')
    expect(variable(area, '--height')).toBe('10rem')
    expect(variable(area, '--color')).toBe('red')
  })

  test('PointsEditor and its points', () => {
    const { container } = render(
      <PointsEditor.Root width={400} height={200}>
        <PointsEditor.Container>
          <PointsEditor.Point value={{ x: 0.5, y: 0.5 }} size={24} />
        </PointsEditor.Container>
      </PointsEditor.Root>,
    )
    const editor = container.querySelector('.tremolo-points-editor')!
    const point = container.querySelector('.tremolo-points-editor-point')!

    expect(variable(editor, '--width')).toBe('400px')
    expect(variable(editor, '--height')).toBe('200px')
    // `size` is both at once.
    expect(variable(point, '--width')).toBe('24px')
    expect(variable(point, '--height')).toBe('24px')
    // Where the point is stays an inline position: it is the value.
    expect((point as HTMLElement).style.left).toBe('50%')
  })
})
