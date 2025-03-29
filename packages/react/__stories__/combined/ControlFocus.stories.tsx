import { createRef, useRef, useState } from 'react'

import { Knob, KnobMethods } from '../../src/components/Knob'
import {
  NumberInput,
  NumberInputMethods,
} from '../../src/components/NumberInput'
import { Slider, SliderMethods } from '../../src/components/Slider'
import { XYPad, XYPadMethods } from '../../src/components/XYPad'

export default {
  title: 'combined/ControlFocus',
  tags: ['!autodocs'],
}

export const ControlFocus = () => {
  const refKeys = ['knob', 'numberInput', 'slider', 'xyPad'] as const
  const refs = useRef({
    knob: createRef<KnobMethods>(),
    numberInput: createRef<NumberInputMethods>(),
    slider: createRef<SliderMethods>(),
    xyPad: createRef<XYPadMethods>(),
  })
  const [value, setValue] = useState(0)
  const [value2, setValue2] = useState(0)
  const [count, setCount] = useState(-1)

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Knob
          ref={refs.current.knob}
          value={value}
          min={0}
          max={100}
          onChange={(v) => setValue(v)}
        />
        <NumberInput
          ref={refs.current.numberInput}
          value={value}
          min={0}
          max={100}
          onChange={(v) => setValue(v)}
        />
        <Slider
          ref={refs.current.slider}
          value={value}
          min={0}
          max={100}
          onChange={(v) => setValue(v)}
        />
        <XYPad
          ref={refs.current.xyPad}
          x={{
            value: value,
            min: 0,
            max: 100,
          }}
          y={{
            value: value2,
            min: 0,
            max: 100,
          }}
          onChange={(x, y) => {
            setValue(x)
            setValue2(y)
          }}
        />
      </div>
      <div>
        <p>Focus Controller</p>
        <button
          type="button"
          onClick={() => {
            const newCount = count + 1
            const key = refKeys[newCount % refKeys.length]
            refs.current[key].current?.focus()
            console.log(document.activeElement)
            setCount(newCount)
          }}
        >
          focus {refKeys[(count + 1) % refKeys.length]}
        </button>{' '}
      </div>
    </>
  )
}
