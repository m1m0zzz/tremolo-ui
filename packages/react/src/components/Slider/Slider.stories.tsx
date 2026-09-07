import { Meta, StoryObj } from '@storybook/react-vite'
import { ComponentProps, useState } from 'react'

import { curveScale, curveWithCenterValue } from '@tremolo-ui/functions'

import { NumberInput } from '../NumberInput'

import { Slider } from '.'

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
          {...args}
          value={value}
          onChange={(v) => setValue(v)}
          onDragStart={(v) => console.log('drag start: ', v)}
          onDragEnd={(v) => console.log('drag end: ', v)}
        >
          <Slider.Track>{thumb && <Slider.Thumb />}</Slider.Track>
          {/* A fixed interval, not `'step'`: over 0-100 with the default
              step of 1 that is 101 marks, and Controls can make `step`
              smaller still. */}
          {marks && <Slider.Marks options={[25, 'mark-number']} />}
        </Slider.Root>
        <p>value: {value}</p>
      </>
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
            value={centerValue}
            onChange={(v) => setCenterValue(v)}
          >
            <NumberInput.InputField />
          </NumberInput.Root>
        </div>
        <Slider.Root
          {...args}
          value={value}
          scale={curveScale(
            curveWithCenterValue(centerValue, args.min, args.max),
          )}
          onChange={(v) => setValue(v)}
        >
          <Slider.Track>
            <Slider.Thumb />
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
          {...args}
          value={value}
          onChange={(v) => setValue(v)}
          style={{
            borderRadius: 0,
          }}
        >
          <Slider.Track
            length={200}
            active="rgb(149,234,231)"
            style={{
              borderRadius: 0,
            }}
          >
            <Slider.Thumb>
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
            {...args}
            value={value}
            onChange={(v) => setValue(v)}
            style={{ flex: '1 1 auto' }}
          >
            <Slider.Track
              style={{
                width: '100%',
              }}
            >
              <Slider.Thumb color="rgb(87, 71, 233)" />
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
            {...args}
            value={value}
            onChange={(v) => setValue(v)}
            // The point of the second one, so it is not left to Controls.
            vertical
            style={{ flex: '1 1 auto' }}
          >
            <Slider.Track
              style={{
                height: '100%',
              }}
            >
              <Slider.Thumb />
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
            {...args}
            value={value}
            onChange={(v) => setValue(v)}
            vertical
          >
            <Slider.Track>
              <Slider.Thumb />
            </Slider.Track>
            <Slider.Marks>
              <Slider.MarksOption value={0} type="mark-number" />
              <Slider.MarksOption value={25} type="mark" />
              <Slider.MarksOption value={50} type="mark-number" />
              <Slider.MarksOption value={75} type="mark" />
              <Slider.MarksOption value={100} type="mark-number" />
            </Slider.Marks>
          </Slider.Root>
          <p>value: {value}</p>
        </section>
        <section style={{ marginBottom: '2rem' }}>
          <Slider.Root {...args} value={value2} onChange={(v) => setValue2(v)}>
            <Slider.Track>
              <Slider.Thumb />
            </Slider.Track>
            <Slider.Marks gap={0} style={{ height: 42 }}>
              <Slider.MarksOption
                value={0}
                type="mark-number"
                length="1rem"
                styles={{ label: { color: 'red' } }}
              />
              <Slider.MarksOption value={25} type="mark" />
              <Slider.MarksOption
                value={50}
                type="mark-number"
                length="0.75rem"
              />
              <Slider.MarksOption value={75} type="mark" />
              <Slider.MarksOption
                value={100}
                type="mark-number"
                length="1rem"
                styles={{ label: { color: 'blue' } }}
              />
            </Slider.Marks>
          </Slider.Root>
          <p>value: {value2}</p>
        </section>
        <section style={{ marginBottom: '2rem' }}>
          <Slider.Root
            {...args}
            value={value3}
            // The step is what `options={['step', 'number']}` reads.
            min={0}
            max={35}
            step={10}
            onChange={(v) => setValue3(v)}
            vertical
          >
            <Slider.Track>
              <Slider.Thumb />
            </Slider.Track>
            <Slider.Marks options={['step', 'number']} />
          </Slider.Root>
          <p>value: {value3}</p>
        </section>
      </>
    )
  },
}
