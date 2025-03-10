import { createContext, useState, useContext, ReactNode } from 'react'

const minContext = createContext(0)
const maxContext = createContext(0)
const stepContext = createContext(0)
const skewContext = createContext(0)
const verticalContext = createContext(false)
const reverseContext = createContext(false)
const disabledContext = createContext(false)

interface Props {
  min: number
  max: number
  step: number
  skew: number
  vertical: boolean
  reverse: boolean
  disabled: boolean
  children: ReactNode
}

/** @category Slider */
export function SliderProvider({
  min: _min,
  max: _max,
  step: _step,
  skew: _skew,
  vertical: _vertical,
  reverse: _reverse,
  disabled: _disabled,
  children,
}: Props) {
  const [min] = useState(_min)
  const [max] = useState(_max)
  const [step] = useState(_step)
  const [skew] = useState(_skew)
  const [vertical] = useState(_vertical)
  const [reverse] = useState(_reverse)
  const [disabled] = useState(_disabled)

  return (
    <minContext.Provider value={min}>
      <maxContext.Provider value={max}>
        <stepContext.Provider value={step}>
          <skewContext.Provider value={skew}>
            <verticalContext.Provider value={vertical}>
              <reverseContext.Provider value={reverse}>
                <disabledContext.Provider value={disabled}>
                  {children}
                </disabledContext.Provider>
              </reverseContext.Provider>
            </verticalContext.Provider>
          </skewContext.Provider>
        </stepContext.Provider>
      </maxContext.Provider>
    </minContext.Provider>
  )
}

/** @category Slider */
export const useMin = () => useContext(minContext)
/** @category Slider */
export const useMax = () => useContext(maxContext)
/** @category Slider */
export const useStep = () => useContext(stepContext)
/** @category Slider */
export const useSkew = () => useContext(skewContext)
/** @category Slider */
export const useVertical = () => useContext(verticalContext)
/** @category Slider */
export const useReverse = () => useContext(reverseContext)
/** @category Slider */
export const useDisabled = () => useContext(disabledContext)
