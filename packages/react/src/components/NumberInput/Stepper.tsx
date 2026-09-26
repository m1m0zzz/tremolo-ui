import {
  ComponentPropsWithoutRef,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { createStepperDrag, type StepperDragInstance } from '@tremolo-ui/dom'

import { useComposedRefs } from '../../compose-refs'

import { StepperProvider, useNumberInputContext } from './context'

type Props = ComponentPropsWithoutRef<'div'>

/**
 * The area the steppers sit in, and a drag handle in its own right: dragging it
 * up and down moves the value one `step` every `drag` pixels. The counting is
 * `createStepperDrag` in the core.
 *
 * The drag lives here rather than on `InputField` because `createDrag` turns
 * off text selection on whatever element it is attached to.
 */
export const Stepper = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(
  function Stepper({ className, style, children, ...props }, forwardedRef) {
    const {
      value,
      disabled,
      readonly,
      drag,
      dragSensitivity,
      pointerLock,
      rawRange,
      changeValue,
    } = useNumberInputContext()
    // Only attached while it can do something: `createDrag` puts
    // `touch-action: none` on the element, and a stepper that cannot be
    // dragged has no reason to stop the page scrolling under a finger.
    const enabled = drag !== null && !disabled && !readonly

    // See useDrag for why the node is held in state rather than a ref.
    const [node, setNode] = useState<HTMLDivElement | null>(null)
    const instanceRef = useRef<StepperDragInstance | null>(null)
    const latest = useRef({ value, changeValue })
    const options = {
      range: rawRange,
      pixels: drag ?? 1,
      sensitivity: dragSensitivity,
      pointerLock,
    }
    const optionsRef = useRef(options)

    // Runs after every render.
    useEffect(() => {
      latest.current = { value, changeValue }
      optionsRef.current = options
      instanceRef.current?.update(options)
    })

    useEffect(() => {
      if (!node || !enabled) return
      const instance = createStepperDrag(node, {
        ...optionsRef.current,
        getValue: () => latest.current.value,
        onChange: (next) => latest.current.changeValue(next),
      })
      instanceRef.current = instance
      return () => {
        instanceRef.current = null
        instance.destroy()
      }
    }, [node, enabled])

    const composedRef = useComposedRefs<HTMLDivElement>(forwardedRef, setNode)

    const context = useMemo(
      () => ({ moved: () => instanceRef.current?.moved() ?? false }),
      [],
    )

    return (
      <StepperProvider value={context}>
        <div ref={composedRef} className={className} style={style} {...props}>
          {children}
        </div>
      </StepperProvider>
    )
  },
)
