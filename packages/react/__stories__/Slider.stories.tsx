import { Meta } from '@storybook/react'
import { normalizeValue, skewWithCenterValue } from '@tremolo-ui/functions'
import { useRef, useState } from 'react'

import { AnimationCanvas } from '../src/components/AnimationCanvas'
import {
  Direction as SliderDirection,
  Slider,
  SliderThumb,
  SliderTrack,
} from '../src/components/Slider'

import thumbImage from './assets/tremolo-slider-thumb.png'
import { getRMS } from './lib/dsp'

export default {
  title: 'React/Components/Slider',
  component: Slider,
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>

export const Basic = () => {
  const [value, setValue] = useState(32)

  return (
    <>
      <Slider value={value} min={0} max={100} onChange={(v) => setValue(v)} />
      <p>value: {value}</p>
    </>
  )
}

export const Direction = () => {
  const [value, setValue] = useState(32)
  const [direction, setDirection] = useState('right')

  const directions = ['right', 'left', 'down', 'up']

  return (
    <div>
      <select
        style={{
          display: 'block',
          marginBottom: '1rem'
        }}
        onChange={(e) => setDirection(e.currentTarget.value)}
      >
        {directions.map((d) =>
          <option key={d} value={d}>{d}</option>
        )}
      </select>
      <Slider
        value={value}
        min={0}
        max={100}
        direction={direction as SliderDirection}
        enableWheel={['raw', 5]}
        onChange={(v) => setValue(v)}
      />
      <p>value: {value}</p>
    </div>
  )
}

export const LogarithmicParameter = () => {
  const [value, setValue] = useState(0)

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Logarithmic parameter</h1>
      <p>
        props: skew={'{'}skewWithCenterValue(centerValue, min, max){'}'}
      </p>
      <p>centerValue = -10</p>
      <p>min = -100, max = 0</p>
      <Slider
        value={value}
        min={-100}
        max={0}
        skew={skewWithCenterValue(-10, -100, 0)}
        direction="up"
        step={0.1}
        onChange={(v) => setValue(v)}
        enableWheel={['normalized', 0.1]}
      />
      <p>{value <= -100 ? '-inf' : value} dB</p>
    </div>
  )
}

export const CustomImage = () => {
  const [value, setValue] = useState(32)

  return (
    <>
      <h1>Custom Image</h1>
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
          activeBg="rgb(149,234,231)"
          activeHoverBg="rgb(149,234,231)"
          length={200}
          style={{ borderRadius: 0 }}
        ></SliderTrack>
        <SliderThumb>
          <img
            src={thumbImage} // TODO: use staticDirs
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

export const Scale = () => {
  const [value, setValue] = useState(32)
  const [value2, setValue2] = useState(32)
  const [value3, setValue3] = useState(-10)

  return (
    <>
      <section style={{ marginBottom: '2rem' }}>
        <p>calibrate (with number)</p>
        <p>scale: mark, scaleTo: 10</p>
        <Slider
          value={value}
          min={0}
          max={100}
          onChange={(v) => setValue(v)}
          scale={[
            { at: 0, type: 'mark-number' },
            { at: 25, type: 'mark' },
            { at: 50, type: 'mark-number' },
            { at: 75, type: 'mark' },
            { at: 100, type: 'mark-number' },
          ]}
        />
        <p>value: {value}</p>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <Slider
          value={value2}
          min={0}
          max={100}
          onChange={(v) => setValue2(v)}
          direction="up"
          scale={[
            {
              at: 0,
              type: 'mark-number',
              style: { labelColor: 'red', length: '1rem' },
            },
            { at: 25, type: 'mark' },
            { at: 50, type: 'mark-number', style: { length: '0.75rem' } },
            { at: 75, type: 'mark' },
            {
              at: 100,
              type: 'mark-number',
              style: { labelColor: 'blue', length: '1rem' },
            },
          ]}
          scaleOption={{
            gap: 0,
            markColor: 'grey',
            labelColor: 'green',
          }}
        />
        <p>value: {value2}</p>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <Slider
          value={value3}
          min={-39}
          max={0}
          step={10}
          onChange={(v) => setValue3(v)}
          direction="up"
          scale={['step', 'number']}
        />
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
        direction="up"
        step={0.1}
        onChange={(v) => {
          setVolume(v)
          if (!gainNode) return
          gainNode.gain.value = normalizeValue(v, min, max, skew)
        }}
        enableWheel={['normalized', 0.1]}
        scale={[
          { at: 6 },
          { at: 0 },
          { at: -6 },
          { at: -12 },
          { at: -24 },
          { at: -100, text: '-inf' },
        ]}
        scaleOption={{
          labelWidth: 30,
        }}
      >
        <SliderThumb
          color="#eee"
          style={{
            width: '2.4rem',
            height: '1.2rem',
            borderRadius: '0.6rem',
            border: '1px solid #aaa',
          }}
        />
        <SliderTrack
          activeBg='#555'
          inactiveBg='#555'
          style={{
            border: '1px solid #aaa',
          }}
        >
          <AnimationCanvas
            width={100}
            height={100}
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
      </Slider>
      <p>{volume <= -100 ? '-inf' : volume} dB</p>
    </div>
  )
}
