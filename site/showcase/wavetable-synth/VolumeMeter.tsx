import { useState } from 'react'
import { Meter } from 'tone'

import { AnimationCanvas, useAnimationFrame } from '@tremolo-ui/react'

interface Props {
  /** Nothing to show until the first note builds the output. */
  meter: Meter | null
  themeColor?: string
}

export function VolumeMeter({
  meter,
  themeColor = 'rgb(67, 170, 248)',
}: Props) {
  const [db, setDb] = useState('-Inf')

  useAnimationFrame(() => {
    if (!meter) return
    let v = meter.getValue()
    v = typeof v === 'number' ? v : v[0]
    v = Math.max(-100, v)
    if (v > -100) {
      setDb(Math.max(-100, v).toFixed(1))
    } else {
      setDb('-Inf')
    }
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AnimationCanvas
        width={60}
        height={12}
        style={{
          borderRadius: 9999,
          background: 'rgb(128 128 128 / 0.12)',
        }}
        draw={(ctx, { width, height }) => {
          ctx.clearRect(0, 0, width, height)
          if (!meter) return

          const _v = meter.getValue()
          const v = typeof _v === 'number' ? _v : _v[0]
          ctx.fillStyle = v >= 0 ? 'rgb(254, 44, 44)' : themeColor
          ctx.fillRect(0, 0, (width * Math.max(0, v + 100)) / 100, height)
        }}
      />
      <div
        className="label"
        style={{
          width: 60,
          textAlign: 'right',
          paddingRight: 8,
        }}
      >
        {db} dB
      </div>
    </div>
  )
}
