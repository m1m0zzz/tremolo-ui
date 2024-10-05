import { useRef } from 'react'

import { AnimationCanvas } from '../src/components/AnimationCanvas'

export default {
  title: 'React/Components/AnimationCanvas',
  component: AnimationCanvas,
  tags: ['autodocs'],
}

export const Basic = () => {
  const countRef = useRef(0)

  return (
    <div>
      <AnimationCanvas
        draw={(ctx, w, h) => {
          ctx.clearRect(0, 0, w, h)
          ctx.font = '32px san-serif'
          ctx.fillText(String(countRef.current), 10, 42)
          countRef.current++
        }}
      />
    </div>
  )
}
