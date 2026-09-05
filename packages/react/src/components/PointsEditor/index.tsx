import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  forwardRef,
  ReactNode,
  useMemo,
  useRef,
} from 'react'

import { InputEventOption } from '@tremolo-ui/functions'

import { Cursor } from '../_util'

import { Background } from './Background'
import { Container } from './Container'
import { PointsEditorProvider } from './context'
import { Point } from './Point'

/*
TODO:

- 複数選択
- modifier
- grid
*/

/**
 * A point moves over 0..1 in both axes, so a nudge of 0.01 crosses the editor
 * in a hundred steps whatever its pixel size.
 */
const DEFAULT_INPUT_EVENT_OPTION: InputEventOption = ['normalized', 0.01]

export interface PointsEditorProps {
  width?: number | string
  height?: number | string

  /**
   * Only the appearance will change.
   * Please consider using with readonly.
   * aria-disabled property is also applied.
   */
  disabled?: boolean
  /**
   * Make the points unmovable.
   * aria-readonly property is also applied.
   */
  readonly?: boolean

  externalStyles?: {
    userSelectNone?: boolean
    cursor?: Cursor
  }

  /**
   * wheel control option for every `Point`. Shift selects the x axis.
   * If null, no event will be triggered
   *
   * A `Point` can override it with a `wheel` of its own.
   */
  wheel?: InputEventOption | null
  /**
   * keyboard control option for every `Point`, on the arrow keys.
   * If null, no event will be triggered
   *
   * A `Point` can override it with a `keyboard` of its own.
   */
  keyboard?: InputEventOption | null

  /**
   * The editor renders exactly what you compose here; there is no default
   * markup to fall back to.
   *
   * @example
   * <PointsEditor.Root>
   *   <PointsEditor.Background>
   *     <svg viewBox="0 0 200 100">...</svg>
   *   </PointsEditor.Background>
   *   <PointsEditor.Container>
   *     {points.map((point, i) => (
   *       <PointsEditor.Point key={i} value={point} onChange={...} />
   *     ))}
   *   </PointsEditor.Container>
   * </PointsEditor.Root>
   */
  children: ReactNode
}

type Props = PointsEditorProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof PointsEditorProps>

export const Root = forwardRef<HTMLDivElement, Props>(
  (
    {
      width = 200,
      height = 100,
      disabled = false,
      readonly = false,
      wheel = DEFAULT_INPUT_EVENT_OPTION,
      keyboard = DEFAULT_INPUT_EVENT_OPTION,
      externalStyles,
      style,
      className,
      children,
      ...props
    },
    forwardedRef,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)

    // Picked apart so that the memo below depends on values rather than on the
    // object literal a caller writes inline, which is new on every render.
    const { userSelectNone = true, cursor = 'grabbing' } = externalStyles ?? {}

    const context = useMemo(
      () => ({
        disabled,
        readonly,
        wheel,
        keyboard,
        externalStyles: { userSelectNone, cursor },
        containerRef,
      }),
      [disabled, readonly, wheel, keyboard, userSelectNone, cursor],
    )

    return (
      <PointsEditorProvider value={context}>
        <div
          ref={forwardedRef}
          className={clsx('tremolo-points-editor', className)}
          aria-disabled={disabled}
          aria-readonly={readonly}
          style={{
            width,
            height,
            ...style,
          }}
          {...props}
        >
          {children}
        </div>
      </PointsEditorProvider>
    )
  },
)

/**
 * Multiple Point Controller
 */
export const PointsEditor = {
  Root,
  Background,
  Container,
  Point,
}

export {
  usePointsEditorContext,
  type PointsEditorContextValue,
} from './context'
export { type PointsEditorBackgroundProps } from './Background'
export { type PointsEditorContainerProps } from './Container'
export { clampPoint, type PointBaseType, type PointProps } from './Point'
