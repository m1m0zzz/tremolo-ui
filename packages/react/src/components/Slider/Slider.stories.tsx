import { Meta, StoryObj } from '@storybook/react-vite'
import { ComponentProps, useEffect, useState } from 'react'

import { curveScale, curveWithCenterValue } from '@tremolo-ui/functions'

import { NumberInput } from '../NumberInput'

import { Slider } from '.'

import numberInputTheme from 'shared/css/NumberInput.module.css'
import sliderTheme from 'shared/css/Slider.module.css'

export default {
  title: 'Components/Slider/Root',
  component: Slider.Root,
  argTypes: {
    value: {
      control: false,
    },
    children: {
      control: false,
    },
  },
} satisfies Meta<Args>

/**
 * Args that are not props: which parts are mounted. Storybook shows anything
 * in `args`, so a story can put its own switches in Controls as long as
 * `render` takes them out before spreading the rest onto the component.
 */
type Parts = {
  thumb: boolean
  marks: boolean
}

type Args = ComponentProps<typeof Slider.Root> & Parts

type Story = StoryObj<Args>

/** Declared on the story, so it only shows where it means something. */
const partsArgTypes = {
  thumb: { control: 'boolean', table: { category: 'Parts' } },
  marks: { control: 'boolean', table: { category: 'Parts' } },
} as const

export const Basic: Story = {
  argTypes: partsArgTypes,
  args: {
    min: 0,
    max: 100,
    thumb: true,
    marks: false,
  },
  render: ({ thumb, marks, ...args }) => {
    const [value, setValue] = useState(0)

    return (
      <>
        <Slider.Root
          className={sliderTheme.root}
          {...args}
          value={value}
          onChange={(v) => setValue(v)}
          onDragStart={(v) => console.log('drag start: ', v)}
          onDragEnd={(v) => console.log('drag end: ', v)}
        >
          <Slider.Track className={sliderTheme.track}>
            {thumb && <Slider.Thumb className={sliderTheme.thumb} />}
          </Slider.Track>
          {/* A fixed interval, not `'step'`: over 0-100 with the default
              step of 1 that is 101 marks, and Controls can make `step`
              smaller still. */}
          {marks && <Slider.Marks className={sliderTheme.marks} options={25} />}
        </Slider.Root>
        <p>value: {value}</p>
      </>
    )
  },
}

/**
 * Manual browser regression check for drag selection suppression. On iOS
 * Safari, long-pressing an unfocused slider can select surrounding text; that
 * also happens before the React body-style guard is removed. Compare this with
 * `main` to make sure the change does not make that existing behavior worse.
 */
export const SelectionSuppression: Story = {
  args: {
    min: 0,
    max: 100,
  },
  render: (args) => {
    const [value, setValue] = useState(50)
    const [selection, setSelection] = useState('')

    useEffect(() => {
      const updateSelection = () => {
        setSelection(document.getSelection()?.toString() ?? '')
      }
      document.addEventListener('selectionchange', updateSelection)
      return () =>
        document.removeEventListener('selectionchange', updateSelection)
    }, [])

    return (
      <div style={{ maxWidth: 640, lineHeight: 1.6 }}>
        <p>
          Drag the slider far into this text. With a mouse, text around the
          control should remain unselected throughout the gesture.
        </p>
        <Slider.Root
          className={sliderTheme.root}
          {...args}
          value={value}
          onChange={setValue}
        >
          <Slider.Track className={sliderTheme.track} style={{ width: 240 }}>
            <Slider.Thumb className={sliderTheme.thumb} />
          </Slider.Track>
        </Slider.Root>
        <p>
          Continue dragging across this sentence and release outside the slider.
          This text should not receive a selection highlight either.
        </p>
        <p>
          Known behavior: on iOS Safari, long-pressing the slider while it is
          unfocused can select surrounding text. The same behavior is present on
          <code> main</code>; compare both versions to check for a regression.
        </p>
        <p aria-live="polite">
          Selected text: <strong>{selection || 'none'}</strong>
        </p>
        <p>Value: {value}</p>
      </div>
    )
  },
}

export const LogarithmicParameter: Story = {
  args: {
    min: -100,
    max: 0,
    step: 0.1,
    scale: curveScale(curveWithCenterValue(-10, -100, 0)),
    vertical: true,
    wheel: ['normalized', 0.1],
    keyboard: ['normalized', 0.1],
  },
  render: (args) => {
    const [value, setValue] = useState(0)
    const [centerValue, setCenterValue] = useState(-10)

    return (
      <>
        <h1>Logarithmic parameter</h1>
        <p>
          scale={'{'}curveScale(curveWithCenterValue(centerValue, min, max))
          {'}'}
        </p>
        <p>
          min = {args.min}, max = {args.max}
        </p>
        <div>
          centerValue:{' '}
          <NumberInput.Root
            className={numberInputTheme.root}
            value={centerValue}
            onChange={(v) => setCenterValue(v)}
          >
            <NumberInput.InputField className={numberInputTheme.field} />
          </NumberInput.Root>
        </div>
        <Slider.Root
          className={sliderTheme.root}
          {...args}
          value={value}
          scale={curveScale(
            curveWithCenterValue(centerValue, args.min, args.max),
          )}
          onChange={(v) => setValue(v)}
        >
          <Slider.Track className={sliderTheme.track}>
            <Slider.Thumb className={sliderTheme.thumb} />
          </Slider.Track>
        </Slider.Root>
        <p>{value <= -100 ? '-inf' : value} dB</p>
      </>
    )
  },
}

export const CustomImage: Story = {
  args: {
    min: 0,
    max: 100,
  },
  render: (args) => {
    const [value, setValue] = useState(32)

    return (
      <>
        <Slider.Root
          className={sliderTheme.root}
          {...args}
          value={value}
          onChange={(v) => setValue(v)}
          style={{
            borderRadius: 0,
          }}
        >
          <Slider.Track
            className={sliderTheme.track}
            length={200}
            active="rgb(149,234,231)"
            style={{
              borderRadius: 0,
            }}
          >
            {/* The thumb is one element: its own look is turned off so that
                only the image shows. */}
            <Slider.Thumb
              className={sliderTheme.thumb}
              style={{ background: 'none', width: 'auto', height: 'auto' }}
            >
              <img
                // staticDirs land at the root of the build, which is not the
                // root of the site once Storybook is served from
                // /i/storybook-react/.
                src={import.meta.env.BASE_URL + 'tremolo-slider-thumb.png'}
                alt="slider thumb"
                draggable={false}
                style={{ display: 'block' }} // remove bottom gap
              />
            </Slider.Thumb>
          </Slider.Track>
        </Slider.Root>
        <p>value: {value}</p>
      </>
    )
  },
}

export const Flex: Story = {
  args: {
    min: 0,
    max: 100,
  },
  render: (args) => {
    const [value, setValue] = useState(32)

    return (
      <div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            width: 400,
            height: 200,
            resize: 'both',
            overflow: 'auto',
            border: '1px solid black',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              padding: 8,
              margin: 8,
              border: '1px solid red',
              background: 'pink',
              flex: '0 1 auto',
            }}
          >
            item1
          </div>
          <Slider.Root
            className={sliderTheme.root}
            {...args}
            value={value}
            onChange={(v) => setValue(v)}
            style={{ flex: '1 1 auto' }}
          >
            <Slider.Track
              className={sliderTheme.track}
              style={{
                width: '100%',
              }}
            >
              <Slider.Thumb
                className={sliderTheme.thumb}
                color="rgb(87, 71, 233)"
              />
            </Slider.Track>
          </Slider.Root>
          <div
            style={{
              padding: 8,
              margin: 8,
              border: '1px solid blue',
              background: 'skyblue',
              flex: '0 1 auto',
            }}
          >
            item3
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            alignItems: 'center',
            width: 200,
            height: 400,
            resize: 'both',
            overflow: 'auto',
            border: '1px solid black',
          }}
        >
          <div
            style={{
              padding: 8,
              margin: 8,
              border: '1px solid red',
              background: 'pink',
              flex: '0 1 auto',
            }}
          >
            item1
          </div>
          <Slider.Root
            className={sliderTheme.root}
            {...args}
            value={value}
            onChange={(v) => setValue(v)}
            // The point of the second one, so it is not left to Controls.
            vertical
            style={{ flex: '1 1 auto' }}
          >
            <Slider.Track
              className={sliderTheme.track}
              style={{
                height: '100%',
              }}
            >
              <Slider.Thumb className={sliderTheme.thumb} />
            </Slider.Track>
          </Slider.Root>
          <div
            style={{
              padding: 8,
              margin: 8,
              border: '1px solid blue',
              background: 'skyblue',
              flex: '0 1 auto',
            }}
          >
            item3
          </div>
        </div>
      </div>
    )
  },
}

/**
 * The three sections differ in what they put in `Slider.Marks`, so each keeps
 * the range it needs. Everything else comes from Controls, and reaches all
 * three at once.
 */
export const ConfigScale: Story = {
  args: {
    min: 0,
    max: 100,
  },
  render: (args) => {
    const [value, setValue] = useState(32)
    const [value2, setValue2] = useState(32)
    const [value3, setValue3] = useState(10)

    return (
      <>
        <section style={{ marginBottom: '2rem' }}>
          <Slider.Root
            className={sliderTheme.root}
            {...args}
            value={value}
            onChange={(v) => setValue(v)}
            vertical
          >
            <Slider.Track className={sliderTheme.track}>
              <Slider.Thumb className={sliderTheme.thumb} />
            </Slider.Track>
            <Slider.Marks className={sliderTheme.marks}>
              <Slider.MarksOption
                className={sliderTheme.marksOption}
                classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
                value={0}
              />
              <Slider.MarksOption
                className={sliderTheme.marksOption}
                classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
                value={25}
                label={null}
              />
              <Slider.MarksOption
                className={sliderTheme.marksOption}
                classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
                value={50}
              />
              <Slider.MarksOption
                className={sliderTheme.marksOption}
                classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
                value={75}
                label={null}
              />
              <Slider.MarksOption
                className={sliderTheme.marksOption}
                classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
                value={100}
              />
            </Slider.Marks>
          </Slider.Root>
          <p>value: {value}</p>
        </section>
        <section style={{ marginBottom: '2rem' }}>
          <Slider.Root
            className={sliderTheme.root}
            {...args}
            value={value2}
            onChange={(v) => setValue2(v)}
          >
            <Slider.Track className={sliderTheme.track}>
              <Slider.Thumb className={sliderTheme.thumb} />
            </Slider.Track>
            <Slider.Marks
              className={sliderTheme.marks}
              gap={0}
              style={{ height: 42 }}
            >
              <Slider.MarksOption
                className={sliderTheme.marksOption}
                classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
                value={0}
                length="1rem"
                styles={{ label: { color: 'red' } }}
              />
              <Slider.MarksOption
                className={sliderTheme.marksOption}
                classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
                value={25}
                label={null}
              />
              <Slider.MarksOption
                className={sliderTheme.marksOption}
                classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
                value={50}
                length="0.75rem"
              />
              <Slider.MarksOption
                className={sliderTheme.marksOption}
                classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
                value={75}
                label={null}
              />
              <Slider.MarksOption
                className={sliderTheme.marksOption}
                classes={{ mark: sliderTheme.mark, label: sliderTheme.label }}
                value={100}
                length="1rem"
                styles={{ label: { color: 'blue' } }}
              />
            </Slider.Marks>
          </Slider.Root>
          <p>value: {value2}</p>
        </section>
        <section style={{ marginBottom: '2rem' }}>
          <Slider.Root
            className={sliderTheme.root}
            {...args}
            value={value3}
            // The step is what `options={{ per: 'step' }}` reads.
            min={0}
            max={35}
            step={10}
            onChange={(v) => setValue3(v)}
            vertical
          >
            <Slider.Track className={sliderTheme.track}>
              <Slider.Thumb className={sliderTheme.thumb} />
            </Slider.Track>
            <Slider.Marks
              className={sliderTheme.marks}
              options={{ per: 'step', mark: false }}
            />
          </Slider.Root>
          <p>value: {value3}</p>
        </section>
      </>
    )
  },
}
