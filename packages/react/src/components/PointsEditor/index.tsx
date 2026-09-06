import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  useMemo,
  useRef,
} from 'react'

import { InputEventOptions, type ModifierValue } from '@tremolo-ui/functions'

import { Cursor } from '../_util'
import { cssLength } from '../_util/cssLength'
import { cx } from '../_util/cx'
import { DEFAULT_DRAG_SENSITIVITY } from '../_util/inputEvent'

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
const DEFAULT_WHEEL: InputEventOptions = ['normalized', 0.01]

/**
 * Shift is the fine-adjustment key everywhere else, so it is bound here too
 * — but only on the keyboard. On the wheel it already means the x axis, and
 * browsers hand shift+wheel over as horizontal scrolling anyway.
 */
const DEFAULT_KEYBOARD: InputEventOptions = {
  default: ['normalized', 0.01],
  shift: ['normalized', 0.001],
}

export interface PointsEditorProps {
  /** Sets `--width`; the size the theme gives it stands when omitted. */
  width?: number | string
  /** Sets `--height`. */
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
   * wheel control option for every `Point`. Scrolling sideways moves x,
   * which is what a browser turns shift+wheel into.
   * If null, no event will be triggered
   *
   * A `Point` can override it with a `wheel` of its own.
   */
  wheel?: InputEventOptions | null
  /**
   * How much one arrow key press moves a `Point`.
   *
   * Shift moves a tenth of the default amount. Name a modifier to change that,
   * or pass a bare tuple to use no modifier at all.
   *
   * If null, no event will be triggered.
   * A `Point` can override it with a `keyboard` of its own.
   */
  keyboard?: InputEventOptions | null

  /**
   * How much a drag moves a `Point`, per modifier key.
   *
   * `1` is the pointer position itself, which is what dragging a point
   * normally is. **Anything else turns the drag relative**: `0.1` makes the
   * same movement cover a tenth of the editor, so the point stops following
   * the pointer and starts moving a tenth as fast. Shift is bound to `0.1` by
   * default, to match what it does on the arrow keys.
   *
   * Pressing or releasing the key mid-drag does not disturb the point: the
   * travel so far is kept and the new sensitivity applies from there. **The
   * pointer and the point stay apart for the rest of the drag** — snapping
   * them back together on release would move the point nobody asked to move.
   *
   * @default { default: 1, shift: 0.1 }
   */
  dragSensitivity?: ModifierValue<number>

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

export const Root = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(
  (
    {
      width,
      height,
      disabled = false,
      readonly = false,
      wheel = DEFAULT_WHEEL,
      keyboard = DEFAULT_KEYBOARD,
      dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
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
        dragSensitivity,
        externalStyles: { userSelectNone, cursor },
        containerRef,
      }),
      [
        disabled,
        readonly,
        wheel,
        keyboard,
        dragSensitivity,
        userSelectNone,
        cursor,
      ],
    )

    return (
      <PointsEditorProvider value={context}>
        <div
          ref={forwardedRef}
          className={cx('tremolo-points-editor', className)}
          aria-disabled={disabled}
          aria-readonly={readonly}
          style={
            {
              '--width': cssLength(width),
              '--height': cssLength(height),
              ...style,
            } as CSSProperties
          }
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
