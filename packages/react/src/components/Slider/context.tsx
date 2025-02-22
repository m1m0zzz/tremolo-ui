import { createContext, useState, useContext, ReactNode } from 'react'

const minContext = createContext(0)
const maxContext = createContext(0)
const stepContext = createContext(0)
const skewContext = createContext(0)
const verticalContext = createContext(false)
const reverseContext = createContext(false)

interface Props {
  min: number
  max: number
  step: number
  skew: number
  vertical: boolean
  reverse: boolean
  children: ReactNode
}

export function SliderValuesProvider({
  min: _min,
  max: _max,
  step: _step,
  skew: _skew,
  vertical: _vertical,
  reverse: _reverse,
  children,
}: Props) {
  const [min] = useState(_min)
  const [max] = useState(_max)
  const [step] = useState(_step)
  const [skew] = useState(_skew)
  const [vertical] = useState(_vertical)
  const [reverse] = useState(_reverse)

  return (
    <minContext.Provider value={min}>
      <maxContext.Provider value={max}>
        <stepContext.Provider value={step}>
          <skewContext.Provider value={skew}>
            <verticalContext.Provider value={vertical}>
              <reverseContext.Provider value={reverse}>
                {children}
              </reverseContext.Provider>
            </verticalContext.Provider>
          </skewContext.Provider>
        </stepContext.Provider>
      </maxContext.Provider>
    </minContext.Provider>
  )
}

export const useMin = () => useContext(minContext)
export const useMax = () => useContext(maxContext)
export const useStep = () => useContext(stepContext)
export const useSkew = () => useContext(skewContext)
export const useVertical = () => useContext(verticalContext)
export const useReverse = () => useContext(reverseContext)
