import { FFT } from 'tone'

import { mapValue } from '@tremolo-ui/functions'

import { AnimationCanvas } from '../../../src/components/AnimationCanvas'

interface Props {
  fft: FFT
  themeColor?: string
}

export function SpectrumAnalyzer({
  fft,
  themeColor = 'rgb(67, 170, 248)',
}: Props) {
  return (
    <div>
      <AnimationCanvas
        width={100}
        height={36}
        style={{
          display: 'block',
          borderRadius: 4,
          background: 'rgb(230, 230, 230)',
        }}
        draw={(ctx, { width, height }) => {
          ctx.clearRect(0, 0, width, height)

          const data = fft.getValue() as Float32Array
          ctx.fillStyle = themeColor
          for (let i = 0; i < data.length; i++) {
            const v = data[i]
            const x = (Math.log(i) / Math.log(data.length)) * width
            const y = mapValue(v, -100, 0, 0, height)
            ctx.fillRect(x, height - y, 1, y)
          }
        }}
      />
    </div>
  )
}
