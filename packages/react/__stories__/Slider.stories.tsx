import { Meta, StoryObj } from '@storybook/react'
import { useRef, useState } from 'react'

import { skewWithCenterValue } from '@tremolo-ui/functions'

import { NumberInput } from '../src/components/NumberInput'
import {
  Slider,
  SliderThumb,
  SliderTrack,
  Scale,
  ScaleOption,
  SliderMethods,
} from '../src/components/Slider'

import { inputEventOptionType } from './lib/typeUtils'

export default {
  title: 'Components/Slider',
  component: Slider,
  argTypes: {
    value: {
      control: false,
    },
    children: {
      control: false,
    },
    wheel: {
      table: {
        type: inputEventOptionType,
      },
    },
    keyboard: {
      table: {
        type: inputEventOptionType,
      },
    },
  },
} satisfies Meta<typeof Slider>

type Story = StoryObj<typeof Slider>

export const Basic: Story = {
  args: {
    min: 0,
    max: 100,
  },
  render: (args) => {
    const [value, setValue] = useState(0)

    return (
      <>
        <Slider {...args} value={value} onChange={(v) => setValue(v)} />
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
    skew: skewWithCenterValue(-10, -100, 0),
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
          skew={'{'}skewWithCenterValue(centerValue, min, max){'}'}
        </p>
        <p>
          min = {args.min}, max = {args.max}
        </p>
        <div>
          centerValue:{' '}
          <NumberInput
            value={centerValue}
            onChange={(v) => setCenterValue(v)}
          />
        </div>
        <Slider
          {...args}
          value={value}
          skew={skewWithCenterValue(centerValue, args.min, args.max)}
          onChange={(v) => setValue(v)}
        />
        <p>{value <= -100 ? '-inf' : value} dB</p>
      </>
    )
  },
}

export const CustomImage = () => {
  const [value, setValue] = useState(32)

  return (
    <>
      <Slider
        value={value}
        min={0}
        max={100}
        onChange={(v) => setValue(v)}
        style={{
          borderRadius: 0,
        }}
      >
        <SliderTrack
          length={200}
          active="rgb(149,234,231)"
          style={{
            borderRadius: 0,
          }}
        ></SliderTrack>
        <SliderThumb>
          <img
            src={'/tremolo-slider-thumb.png'}
            alt="slider thumb"
            draggable={false}
            style={{ display: 'block' }} // remove bottom gap
          />
        </SliderThumb>
      </Slider>
      <p>value: {value}</p>
    </>
  )
}

export const Flex = () => {
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
        <Slider
          value={value}
          min={0}
          max={100}
          onChange={(v) => setValue(v)}
          style={{ flex: '1 1 auto' }}
        >
          <SliderTrack
            style={{
              width: '100%',
            }}
          />
        </Slider>
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
        <Slider
          value={value}
          min={0}
          max={100}
          onChange={(v) => setValue(v)}
          vertical
          style={{ flex: '1 1 auto' }}
        >
          <SliderTrack
            style={{
              height: '100%',
            }}
          />
        </Slider>
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
}

export const ConfigScale = () => {
  const [value, setValue] = useState(32)
  const [value2, setValue2] = useState(32)
  const [value3, setValue3] = useState(10)

  return (
    <>
      <section style={{ marginBottom: '2rem' }}>
        <Slider
          value={value}
          min={0}
          max={100}
          onChange={(v) => setValue(v)}
          vertical
        >
          <Scale>
            <ScaleOption value={0} type="mark-number" />
            <ScaleOption value={25} type="mark" />
            <ScaleOption value={50} type="mark-number" />
            <ScaleOption value={75} type="mark" />
            <ScaleOption value={100} type="mark-number" />
          </Scale>
        </Slider>
        <p>value: {value}</p>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <Slider value={value2} min={0} max={100} onChange={(v) => setValue2(v)}>
          <Scale gap={0} style={{ height: 42 }}>
            <ScaleOption
              value={0}
              type="mark-number"
              length="1rem"
              styles={{ label: { color: 'red' } }}
            />
            <ScaleOption value={25} type="mark" />
            <ScaleOption value={50} type="mark-number" length="0.75rem" />
            <ScaleOption value={75} type="mark" />
            <ScaleOption
              value={100}
              type="mark-number"
              length="1rem"
              styles={{ label: { color: 'blue' } }}
            />
          </Scale>
        </Slider>
        <p>value: {value2}</p>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <Slider
          value={value3}
          min={0}
          max={35}
          step={10}
          onChange={(v) => setValue3(v)}
          vertical
        >
          <Scale options={['step', 'number']} />
        </Slider>
        <p>value: {value3}</p>
      </section>
    </>
  )
}

export const Ref: Story = {
  args: {
    min: 0,
    max: 100,
  },
  render: (args) => {
    const [value, setValue] = useState(0)
    const sliderRef = useRef<SliderMethods>(null)

    return (
      <>
        <Slider
          {...args}
          ref={sliderRef}
          value={value}
          onChange={(v) => setValue(v)}
        />
        <p>value: {value}</p>
        <button type="button" onClick={() => sliderRef.current?.focus()}>
          focus slider
        </button>{' '}
        <button type="button" onClick={() => sliderRef.current?.blur()}>
          blur slider
        </button>
      </>
    )
  },
}
