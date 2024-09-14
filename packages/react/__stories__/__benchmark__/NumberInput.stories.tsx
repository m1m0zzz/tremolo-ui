import { useRef, useCallback } from 'react'
import {
  Benchmark,
  BenchmarkRef,
  BenchResultsType,
} from 'react-component-benchmark'

import { NumberInput } from '../../src/components/NumberInput'

export default {
  title: 'React/Components/__benchmark__/NumberInput',
  component: MyComponentBenchmark,
}

export function MyComponentBenchmark() {
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
        component={NumberInput}
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
