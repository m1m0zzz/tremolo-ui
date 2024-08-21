import { useState } from 'react';
import { Direction as SliderDirection, Slider } from '../src/components/Slider';

export default {
  title: 'Slider',
  component: Slider,
};

export const Minimal = () => {
  const [value, setValue] = useState(32)

  return (
    <>
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

export const Basic = () => {
  const [value, setValue] = useState(32)

  return (
    <>
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
              onChange={(v) => setter(v)}
            ></Slider>
            <p>value: {value}%</p>
          </div>
        )
      })}
    </div>
  )
}

export const DarkMode = () => {
  const [value, setValue] = useState(0.8)

  return (
    <div
      style={{
        backgroundColor: "#352F44",
        color: "#eee",
        margin: 0,
        padding: "1rem 3rem"
      }}
    >
      <h2>dark mode</h2>
      <Slider
        value={value}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => setValue(v)}
        color="#FAF0E6"
        bg="#B9B4C7"
      ></Slider>
      <p>value: {value}</p>
    </div>
  )
}

export const VolumeFader = () => {
  const [value, setValue] = useState(0)

  return (
    <div style={{padding: "1rem"}}>
      <Slider
        value={value}
        min={-100}
        max={0}
        skewFactor={1}
        direction='up'
        onChange={(v) => setValue(v)}
      ></Slider>
      <p>{value <= -100 ? "-inf" : value} dB</p>
    </div>
  )
}

