import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { mapValue } from '@tremolo-ui/functions'
import type { Units } from '@tremolo-ui/functions'

import { AnimationCanvas } from '../src/components/AnimationCanvas'
import { NumberInput } from '../src/components/NumberInput'
import { PointBaseType, PointsEditor } from '../src/components/PointsEditor'

import styles from './styles/PointsEditor.module.css'

export default {
  title: 'Components/PointsEditor/Root',
  component: PointsEditor.Root,
  argTypes: {
    children: {
      control: false,
    },
  },
} satisfies Meta<typeof PointsEditor.Root>

type Story = StoryObj<typeof PointsEditor.Root>

const themeColor = '#34c2ed'

export const Basic: Story = {
  args: {},
  render: (args) => {
    const initialPoints: Record<string, PointBaseType> = {
      'p-0': { x: 0, y: 0.5 },
      'p-1': { x: 0.25, y: 0 },
      'p-2': { x: 0.75, y: 1 },
      'p-3': { x: 1, y: 0.5 },
    }

    const [points, setPoints] = useState(initialPoints)

    const w = 200
    const h = 100

    const sortedPoints = Object.values(points).sort((a, b) => a.x - b.x)
    const svgPath = sortedPoints
      .map(({ x, y }, i) => (i === 0 ? 'M ' : 'L ') + `${x * w}, ${y * h}`)
      .join()

    return (
      <div
        style={{
          padding: 16,
          border: `${themeColor} solid 1px`,
          borderRadius: 8,
          width: 'min-content',
        }}
      >
        <PointsEditor.Root {...args}>
          <PointsEditor.Background>
            <svg
              viewBox={`0 0 ${w} ${h}`}
              xmlns="http://www.w3.org/2000/svg"
              stroke={themeColor}
              style={{ overflow: 'visible' }}
            >
              <path fill="none" d={svgPath} />
            </svg>
          </PointsEditor.Background>
          <PointsEditor.Container>
            {Object.entries(points).map(([id, point]) => (
              <PointsEditor.Point
                key={id}
                id={id}
                value={point}
                color={themeColor}
                onChange={({ x, y }) => {
                  setPoints({ ...points, [id]: { x, y } })
                }}
              />
            ))}
          </PointsEditor.Container>
        </PointsEditor.Root>
      </div>
    )
  },
}

/**
 * A point takes focus, so the arrow keys move it and the wheel moves it while
 * it is focused — shift selects the x axis. The wheel works anywhere over the
 * editor, not only over the point itself, and moves the focused point rather
 * than the one under the cursor.
 *
 * `Root` sets the step for every point; a `Point` can override it, or pass
 * `null` to opt out.
 */
export const KeyboardAndWheel = () => {
  const [coarse, setCoarse] = useState<PointBaseType>({ x: 0.25, y: 0.5 })
  const [fine, setFine] = useState<PointBaseType>({ x: 0.75, y: 0.5 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p>
        Click a point, then use the arrow keys, or the wheel anywhere over the
        editor.
      </p>
      <PointsEditor.Root keyboard={['normalized', 0.05]}>
        <PointsEditor.Background
          style={{ background: '#f2f4f5', borderRadius: 4 }}
        />
        <PointsEditor.Container>
          <PointsEditor.Point
            className={styles.focusRing}
            style={{ color: themeColor }}
            value={coarse}
            color={themeColor}
            onChange={setCoarse}
          />
          <PointsEditor.Point
            className={styles.focusRing}
            style={{ color: '#ed6a34' }}
            value={fine}
            color="#ed6a34"
            keyboard={['normalized', 0.005]}
            onChange={setFine}
          />
        </PointsEditor.Container>
      </PointsEditor.Root>
      <p>
        blue: 0.05 per key ({coarse.x.toFixed(3)}, {coarse.y.toFixed(3)})
        <br />
        orange: 0.005 per key ({fine.x.toFixed(3)}, {fine.y.toFixed(3)})
      </p>
    </div>
  )
}

function add(a: PointBaseType, b: PointBaseType): PointBaseType {
  return { x: a.x + b.x, y: a.y + b.y }
}

const MIN_MS = 1
const MAX_MS = 1000

const MS_SEC_UNITS: Units = [
  ['ms', 1],
  ['s', 1000],
]

function slope1(x: number, order: number) {
  return x ** order
}

function slope2(x: number, order: number) {
  return 1 - Math.pow(1 - x, order)
}

const slopePointYMin = slope1(0.5, 4)
const slopePointYMax = slope2(0.5, 4)

function getBaseLog(x: number, y: number) {
  return Math.log(y) / Math.log(x)
}

function slopeFunction(x: number, slopePercent: number) {
  if (slopePercent < 0.5) {
    return slope1(x, getBaseLog(0.5, slopePercent))
  } else {
    return slope2(x, getBaseLog(0.5, 1 - slopePercent))
  }
}

function slope2percent(slope: number) {
  return mapValue(slope, slopePointYMin, slopePointYMax, -100, 100)
}

function percent2slope(percent: number) {
  return mapValue(percent, -100, 100, slopePointYMin, slopePointYMax)
}

function toNorm(target: 'A' | 'D' | 'S' | 'R', rawValue: number) {
  switch (target) {
    case 'A':
      return mapValue(rawValue, MIN_MS, MAX_MS, 0, 1 / 3)
    case 'D':
      return mapValue(rawValue, MIN_MS, MAX_MS, 0, 1 / 3)
    case 'S':
      return (100 - rawValue) / 100
    case 'R':
      return mapValue(rawValue, MIN_MS, MAX_MS, 2 / 3, 1)
  }
}

function toRaw(target: 'A' | 'D' | 'S' | 'R', normalizedValue: number) {
  switch (target) {
    case 'A':
      return mapValue(normalizedValue, 0, 1 / 3, MIN_MS, MAX_MS)
    case 'D':
      return mapValue(normalizedValue, 0, 1 / 3, MIN_MS, MAX_MS)
    case 'S':
      return (1 - normalizedValue) * 100
    case 'R':
      return mapValue(normalizedValue, 2 / 3, 1, MIN_MS, MAX_MS)
  }
}

export const ADSRWithSlope = () => {
  const [A, setA] = useState(toNorm('A', 100))
  const [D, setD] = useState(toNorm('D', 100))
  const [S, setS] = useState(toNorm('S', 50))
  const [R, setR] = useState(toNorm('R', 300))
  const [aSlope, setASlope] = useState(0.5)
  const [dSlope, setDSlope] = useState(0.5)
  const [rSlope, setRSlope] = useState(0.5)

  const w = 300
  const h = 100
  const pointProps: Partial<Parameters<typeof PointsEditor.Point>[0]> = {
    size: 30,
    className: styles.point,
    children: <div className={styles.pointInner} />,
  }

  const subPointProps: Partial<Parameters<typeof PointsEditor.Point>[0]> = {
    size: 30,
    className: styles.point,
    children: (
      <div className={`${styles.pointInner} ${styles.subPointInner}`} />
    ),
  }

  return (
    <div className={styles.root}>
      <div className={styles.flex}>
        <div className={styles.adsr}>
          <PointsEditor.Root width={w} height={h}>
            <PointsEditor.Background>
              <AnimationCanvas
                relativeSize
                draw={(ctx, { width, height }) => {
                  ctx.clearRect(0, 0, width, height)
                  ctx.beginPath()
                  // A
                  ctx.moveTo(0, height)
                  for (let i = 0; i < Math.floor(A * width); i++) {
                    const x = i / Math.floor(A * width)
                    const y = slopeFunction(x, aSlope)
                    ctx.lineTo(i, (1 - y) * height)
                  }
                  ctx.lineTo(A * width, 0)

                  // D
                  for (let i = 0; i < Math.floor(D * width); i++) {
                    const x = i / Math.floor(D * width)
                    const y = slopeFunction(x, 1 - dSlope)
                    ctx.lineTo(A * width + i, y * height * S)
                  }
                  ctx.lineTo((A + D) * width, S * height)
                  // S
                  ctx.lineTo(0.67 * width, S * height)

                  // R
                  for (let i = 0; i < Math.floor((R - 0.66) * width); i++) {
                    const x = i / Math.floor((R - 0.66) * width)
                    const y = slopeFunction(x, 1 - rSlope)
                    ctx.lineTo(0.67 * width + i, (S + y * (1 - S)) * height)
                  }
                  ctx.lineTo(R * width, 1 * height)

                  ctx.strokeStyle = themeColor
                  ctx.stroke()
                }}
                animate={false}
              />
            </PointsEditor.Background>
            <PointsEditor.Container>
              <PointsEditor.Point
                {...subPointProps}
                value={{ x: A / 2, y: slopeFunction(0.5, 1 - aSlope) }}
                min={{ y: slopePointYMin }}
                max={{ y: slopePointYMax }}
                onChange={({ y }) => setASlope(1 - y)}
              />
              <PointsEditor.Point
                {...pointProps}
                value={{ x: A, y: 0 }}
                max={{ x: 1 / 3 }}
                onChange={({ x }) => setA(x)}
              />
              <PointsEditor.Point
                {...subPointProps}
                value={{
                  x: (A + A + D) / 2,
                  y: slopeFunction(0.5, 1 - dSlope) * S,
                }}
                min={{ y: slopePointYMin }}
                max={{ y: mapValue(slopePointYMax, 0, 1, 0, S) }}
                onChange={({ y }) => setDSlope(1 - y / S)}
              />
              <PointsEditor.Point
                {...pointProps}
                value={add({ x: A, y: 0 }, { x: D, y: S })}
                min={{ x: A }}
                max={{ x: A + 1 / 3 }}
                onChange={({ x, y }) => {
                  setD(x - A)
                  setS(y)
                }}
              />
              <PointsEditor.Point
                {...subPointProps}
                value={{
                  x: (2 / 3 + R) / 2,
                  y: S + slopeFunction(0.5, 1 - rSlope) * (1 - S),
                }}
                min={{ y: mapValue(slopePointYMin, 0, 1, S, 1) }}
                max={{ y: slopePointYMax }}
                onChange={({ y }) => setRSlope(1 - (y - S) / (1 - S))}
              />
              <PointsEditor.Point
                {...pointProps}
                value={{ x: R, y: 1 }}
                min={{ x: 2 / 3 }}
                onChange={({ x }) => setR(x)}
              />
            </PointsEditor.Container>
          </PointsEditor.Root>
        </div>
        <div className={styles.slopeMeters}>
          <div className={styles.title}>A</div>
          <div className={styles.title}>D</div>
          <div className={styles.title}>S</div>
          <div className={styles.title}>R</div>
          {[
            {
              id: 'A',
              value: toRaw('A', A),
              min: MIN_MS,
              max: MAX_MS,
              units: MS_SEC_UNITS,
              onChange: (rawValue: number) => setA(toNorm('A', rawValue)),
            },
            {
              id: 'D',
              value: toRaw('D', D),
              min: MIN_MS,
              max: MAX_MS,
              units: MS_SEC_UNITS,
              onChange: (rawValue: number) => setD(toNorm('D', rawValue)),
            },
            {
              id: 'S',
              value: toRaw('S', S),
              min: 0,
              max: 100,
              digit: 0,
              units: '%',
              onChange: (rawValue: number) => setS(toNorm('S', rawValue)),
            },
            {
              id: 'R',
              value: toRaw('R', R),
              min: MIN_MS,
              max: MAX_MS,
              units: MS_SEC_UNITS,
              onChange: (rawValue: number) => setR(toNorm('R', rawValue)),
            },
          ].map((props) => {
            return (
              <NumberInput.Root
                key={props.id}
                digit={0}
                className={styles.inputWrapper}
                {...props}
              >
                <NumberInput.InputField className={styles.input} />
              </NumberInput.Root>
            )
          })}
          {[
            {
              id: 'A-slope',
              value: slope2percent(aSlope),
              onChange: (v: number) => setASlope(percent2slope(v)),
            },
            {
              id: 'D-slope',
              value: slope2percent(dSlope),
              onChange: (v: number) => setDSlope(percent2slope(v)),
            },
            null,
            {
              id: 'R-slope',
              value: slope2percent(rSlope),
              onChange: (v: number) => setRSlope(percent2slope(v)),
            },
          ].map((props) => {
            if (props === null) return <div key={'empty'}></div>
            const { id, value, onChange } = props
            return (
              <NumberInput.Root
                key={id}
                id={id}
                value={value}
                min={-100}
                max={100}
                digit={0}
                units={'%'}
                className={styles.inputWrapper}
                onChange={onChange}
              >
                <NumberInput.InputField className={styles.input} />
              </NumberInput.Root>
            )
          })}
        </div>
      </div>
    </div>
  )
}
