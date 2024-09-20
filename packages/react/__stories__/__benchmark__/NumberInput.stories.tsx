import { useRef, useCallback } from 'react'
import {
  Benchmark,
  BenchmarkRef,
  BenchResultsType,
} from 'react-component-benchmark'

import { ModuleCSSAndClassName } from './components/ModuleCSSAndClassName'
import overrideStyle from './components/override.module.css'

export default {
  title: 'React/Components/__benchmark__/NumberInput',
  component: ComponentBenchmark,
}

export function ComponentBenchmark() {
  const ref = useRef<BenchmarkRef>(null)

  const handleComplete = useCallback((results: BenchResultsType) => {
    console.log(results)
  }, [])

  const handleStart = () => {
    ref.current?.start()
  }

  return (
    <div>
      <button onClick={handleStart}>Run</button>
      <Benchmark
        component={ModuleCSSAndClassName}
        componentProps={{
          value: 20,
        }}
        onComplete={handleComplete}
        ref={ref}
        samples={500}
        timeout={10000}
        type="mount"
      />
    </div>
  )
}

export function _ModuleCSSAndClassName() {
  return <ModuleCSSAndClassName value={32} className={overrideStyle.or} />
}
