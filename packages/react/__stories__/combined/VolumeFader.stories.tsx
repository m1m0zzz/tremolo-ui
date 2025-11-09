import { useRef, useState } from 'react'

import { normalizeValue, skewWithCenterValue } from '@tremolo-ui/functions'

import { AnimationCanvas } from '../../src/components/AnimationCanvas'
import { Slider } from '../../src/components/Slider'
import { getRMS } from '../lib/dsp'

import styles from '../styles/Slider.module.css'

export default {
  title: 'combined/VolumeFader',
  tags: ['!autodocs'],
}

export const VolumeFader = () => {
  const [volume, setVolume] = useState(0)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [gainNode, setGainNode] = useState<GainNode | null>(null)
  const [analyzerNode, setAnalyzerNode] = useState<AnalyserNode | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const dataArray = useRef<Float32Array<ArrayBuffer>>(null)

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
        <Slider.Thumb
          className={styles.thumb}
          style={{
            width: '2.4rem',
            height: '1.2rem',
            borderRadius: '0.6rem',
            border: '1px solid #aaa',
          }}
        />
        <Slider.Track
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
            draw={(ctx, { width, height }) => {
              ctx.clearRect(0, 0, width, height)
              if (!analyzerNode || !dataArray.current) return
              analyzerNode.getFloatTimeDomainData(dataArray.current)
              const rms = getRMS(dataArray.current)
              const barH = normalizeValue(rms, min, max, skew) * height
              ctx.fillRect(0, height - barH, width, height)
            }}
          />
        </Slider.Track>
        <Slider.Scale>
          <Slider.ScaleOption value={6} labelWidth={30} />
          <Slider.ScaleOption value={0} labelWidth={30} />
          <Slider.ScaleOption value={-6} labelWidth={30} />
          <Slider.ScaleOption value={-12} labelWidth={30} />
          <Slider.ScaleOption value={-24} labelWidth={30} />
          <Slider.ScaleOption value={-100} labelWidth={30} label="-inf" />
        </Slider.Scale>
      </Slider>
      <p>{volume <= -100 ? '-inf' : volume} dB</p>
    </div>
  )
}
