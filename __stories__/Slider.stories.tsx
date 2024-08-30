import { useState } from 'react';
import { Direction as SliderDirection, Slider } from '@/components/Slider';
import { skewWithCenterValue } from '@/math';

// import thumbImage from "./assets/tremolo-slider-thumb.png"

export default {
  title: 'Components/Slider',
  component: Slider,
};

export const Basic = () => {
  const [value, setValue] = useState(32)

  return (
    <>
      <h1>Slider with React.useState</h1>
      <Slider
        value={value}
        min={0}
        max={100}
        onChange={(v) => setValue(v)}
      ></Slider>
      <p>value: {value}</p>
    </>
  )
}

export const Direction = () => {
  const [value1, setValue1] = useState(32)
  const [value2, setValue2] = useState(32)
  const [value3, setValue3] = useState(32)
  const [value4, setValue4] = useState(32)

  const item = [
    {
      direction: "right",
      color: "#ffdbc9",
      value: value1,
      setter: setValue1
    },
    {
      direction: "left",
      color: "#fffcc9",
      value: value2,
      setter: setValue2
    },
    {
      direction: "down",
      color: "#c9ffd4",
      value: value3,
      setter: setValue3
    },
    {
      direction: "up",
      color: "#cdc9ff",
      value: value4,
      setter: setValue4
    }
  ]

  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        width: "100%",
        flexWrap: "wrap",
      }}
    >
      {item.map(({direction, color, value, setter}, i) => {
        return (
          <div
            key={direction}
            style={{
              width: "calc(50% - 2rem)",
              border: `0.5rem solid ${color}`,
              padding: "0.5rem",
            }}
          >
            <p>{direction}</p>
            <Slider
              value={value}
              min={0}
              max={100}
              direction={direction as SliderDirection}
              enableWheel={["raw", 5]}
              onChange={(v) => setter(v)}
            ></Slider>
            <p>value: {value}%</p>
          </div>
        )
      })}
    </div>
  )
}

export const VolumeFader = () => {
  const [value, setValue] = useState(0)

  return (
    <div style={{padding: "1rem"}}>
      <h1>Logarithmic parameter</h1>
      <p>props: skew={'{'}skewWithCenterValue(centerValue, min, max){'}'}</p>
      <p>centerValue = -10</p>
      <p>min = -100, max = 0</p>
      <Slider
        value={value}
        min={-100}
        max={0}
        skew={skewWithCenterValue(-10, -100, 0)}
        direction='up'
        step={0.1}
        onChange={(v) => setValue(v)}
        enableWheel={["normalized", 0.1]}
      ></Slider>
      <p>{value <= -100 ? "-inf" : value} dB</p>
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
        length={200}
        color='rgb(149,234,231)'
        onChange={(v) => setValue(v)}
        style={{
          borderRadius: 0,
        }}
      >
        <img
          src={"/__stories__/assets/tremolo-slider-thumb.png"} // TODO: use staticDirs
          draggable={false}
          style={{display: "block"}} // remove bottom gap
        />
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
      <section style={{marginBottom: "2rem"}}>
        <p>calibrate (with number)</p>
        <p>scale: mark, scaleTo: 10</p>
        <Slider
          value={value}
          min={0}
          max={100}
          onChange={(v) => setValue(v)}
          scale={[
            {at: 0, type: 'mark-number'},
            {at: 25, type: 'mark'},
            {at: 50, type: 'mark-number'},
            {at: 75, type: 'mark'},
            {at: 100, type: 'mark-number'}
          ]}
        ></Slider>
        <p>value: {value}</p>
      </section>
      <section style={{marginBottom: "2rem"}}>
        <Slider
          value={value2}
          min={0}
          max={100}
          onChange={(v) => setValue2(v)}
          direction='up'
          scale={[
            {at: 0, type: 'mark-number', style: {labelColor: "red", length: "1rem"}},
            {at: 25, type: 'mark'},
            {at: 50, type: 'mark-number', style: {length: "0.75rem"}},
            {at: 75, type: 'mark'},
            {at: 100, type: 'mark-number', style: {labelColor: "blue", length: "1rem"}}
          ]}
          scaleOption={{
            gap: 0,
            markColor: "grey",
            labelColor: "green"
          }}
        />
        <p>value: {value2}</p>
      </section>
      <section style={{marginBottom: "2rem"}}>
        <Slider
          value={value3}
          min={-39}
          max={0}
          step={10}
          onChange={(v) => setValue3(v)}
          direction='up'
          scale={["step", "number"]}
        />
        <p>value: {value3}</p>
      </section>
    </>
  )
}
