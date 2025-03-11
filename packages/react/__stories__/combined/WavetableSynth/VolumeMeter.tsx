import { useState } from 'react'
import { Meter } from 'tone'

import { AnimationCanvas } from '../../../src/components/AnimationCanvas'
import { useAnimationFrame } from '../../../src/hooks/useAnimationFrame'

interface Props {
  meter: Meter
  themeColor?: string
}

export function VolumeMeter({
  meter,
  themeColor = 'rgb(67, 170, 248)',
}: Props) {
  const [db, setDb] = useState('-Inf')

  useAnimationFrame(() => {
    let v = meter.getValue()
    v = typeof v == 'number' ? v : v[0]
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
          background: 'rgb(230, 230, 230)',
        }}
        draw={(ctx, _w, _h) => {
          const w = _w.current
          const h = _h.current
          ctx.clearRect(0, 0, w, h)

          const _v = meter.getValue()
          const v = typeof _v == 'number' ? _v : _v[0]
          ctx.fillStyle = v >= 0 ? 'rgb(254, 44, 44)' : themeColor
          ctx.fillRect(0, 0, (w * Math.max(0, v + 100)) / 100, h)
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
