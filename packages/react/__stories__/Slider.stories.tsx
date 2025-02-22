import { Meta, StoryObj } from '@storybook/react'
import { useRef, useState } from 'react'

import { normalizeValue, skewWithCenterValue } from '@tremolo-ui/functions'

import { AnimationCanvas } from '../src/components/AnimationCanvas'
import { NumberInput } from '../src/components/NumberInput'
import {
  Slider,
  SliderThumb,
  SliderTrack,
  Scale,
  ScaleOption,
} from '../src/components/Slider'

import { getRMS } from './lib/dsp'
import { inputEventOptionType } from './lib/typeUtils'

import styles from './styles/Slider.module.css'

export default {
  title: 'React/Components/Slider',
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
        <p>
          centerValue:{' '}
          <NumberInput
            value={centerValue}
            onChange={(v) => setCenterValue(v)}
            typeNumber
          />
        </p>
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
          <Scale style={{ display: 'block' }}>
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

export const VolumeFader = () => {
  const [volume, setVolume] = useState(0)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [gainNode, setGainNode] = useState<GainNode | null>(null)
  const [analyzerNode, setAnalyzerNode] = useState<AnalyserNode | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const dataArray = useRef<Float32Array>()

  const min = -100
  const max = 6
  const skew = skewWithCenterValue(-10, min, max)

  const handleAudio = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    const file = event.target.files?.[0]
    if (!file) return
    const fileUrl = URL.createObjectURL(file)
    let ctx: AudioContext
    if (audioContext) {
      ctx = audioContext
    } else {
      ctx = new AudioContext()

      const audioIn = new MediaElementAudioSourceNode(ctx, {
        mediaElement: audioRef.current,
      })
      const _gainNode = new GainNode(ctx)
      const _analyzerNode = new AnalyserNode(ctx)
      audioIn.connect(_gainNode)
      _gainNode.connect(_analyzerNode)
      _analyzerNode.connect(ctx.destination)

      dataArray.current = new Float32Array(_analyzerNode.frequencyBinCount)

      setAudioContext(ctx)
      setGainNode(_gainNode)
      setAnalyzerNode(_analyzerNode)
    }
    console.log(ctx)

    audioRef.current.src = fileUrl
    audioRef.current.load()
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Extra Example: Volume Fader</h1>
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="file"
          accept="audio/*"
          style={{
            display: 'block',
            marginBottom: '1rem',
          }}
          onChange={(event) => {
            handleAudio(event)
          }}
        />
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio ref={audioRef} controls={true} controlsList="nodownload" />
      </div>

      <Slider
        value={volume}
        min={min}
        max={max}
        skew={skew}
        step={0.1}
        onChange={(v) => {
          setVolume(v)
          if (!gainNode) return
          gainNode.gain.value = normalizeValue(v, min, max, skew)
        }}
        vertical
        wheel={['normalized', 0.1]}
      >
        <SliderThumb
          className={styles.thumb}
          style={{
            width: '2.4rem',
            height: '1.2rem',
            borderRadius: '0.6rem',
            border: '1px solid #aaa',
          }}
        />
        <SliderTrack
          active="#555"
          inactive="#555"
          style={{
            border: '1px solid #aaa',
          }}
        >
          <AnimationCanvas
            relativeSize={true}
            init={(ctx) => {
              ctx.fillStyle = '#42eb53'
            }}
            draw={(ctx, w, h) => {
              ctx.clearRect(0, 0, w.current, h.current)
              if (!analyzerNode || !dataArray.current) return
              analyzerNode.getFloatTimeDomainData(dataArray.current)
              const rms = getRMS(dataArray.current)
              const barH = normalizeValue(rms, min, max, skew) * h.current
              ctx.fillRect(0, h.current - barH, w.current, h.current)
            }}
          />
        </SliderTrack>
        <Scale>
          <ScaleOption value={6} labelWidth={30} />
          <ScaleOption value={0} labelWidth={30} />
          <ScaleOption value={-6} labelWidth={30} />
          <ScaleOption value={-12} labelWidth={30} />
          <ScaleOption value={-24} labelWidth={30} />
          <ScaleOption value={-100} labelWidth={30} label="-inf" />
        </Scale>
      </Slider>
      <p>{volume <= -100 ? '-inf' : volume} dB</p>
    </div>
  )
}
