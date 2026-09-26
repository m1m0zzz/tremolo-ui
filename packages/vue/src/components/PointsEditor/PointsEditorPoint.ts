import {
  computed,
  defineComponent,
  h,
  mergeProps,
  ref,
  useId,
  watch,
  type PropType,
} from 'vue'

import {
  arrowKeyMove,
  clampPoint,
  createDragValue,
  elementMapping,
  POINT_AXIS,
  selectModifier,
  type InputEventOption,
  type ModifierValue,
  type PointPosition,
  type PointsEditorPoint as PointRegistration,
} from '@tremolo-ui/dom'

import { checkPlacement } from '../_util/placement'
import { visuallyHiddenRangeInput } from '../_util/visually-hidden-range-input'

import { usePointsEditorContext } from './context'

type PerAxis = string | Partial<Record<'x' | 'y', string>>

const perAxis = (setting: PerAxis | undefined, axis: 'x' | 'y') =>
  typeof setting === 'string' ? setting : setting?.[axis]

/** One point, bound with `v-model` as `{ x, y }` from 0 to 1. */
export const PointsEditorPoint = /* @__PURE__ */ defineComponent({
  name: 'PointsEditorPoint',
  inheritAttrs: false,
  props: {
    /** Where the point is, with `y` growing downwards. Bind it with `v-model`. */
    modelValue: { type: Object as PropType<PointPosition>, required: true },
    /** How the selection refers to this point. One is generated when left out. */
    id: String,
    /** The lowest position the point can take, per axis. */
    min: Object as PropType<Partial<PointPosition>>,
    /** The highest position the point can take, per axis. */
    max: Object as PropType<Partial<PointPosition>>,
    /** Sets `--color`, for the theme to colour the point with. */
    color: String,
    /** Overrides the `disabled` of `PointsEditor`. */
    disabled: { type: Boolean, default: undefined },
    /** Overrides the `readonly` of `PointsEditor`. */
    readonly: { type: Boolean, default: undefined },
    /** Overrides the `wheel` of `PointsEditor`; `null` turns it off. */
    wheel: {
      type: [Array, Object] as PropType<ModifierValue<InputEventOption> | null>,
      default: undefined,
    },
    /** Overrides the `keyboard` of `PointsEditor`; `null` turns it off. */
    keyboard: {
      type: [Array, Object] as PropType<ModifierValue<InputEventOption> | null>,
      default: undefined,
    },
    /** The accessible name of each axis, or one for both. */
    ariaLabel: [String, Object] as PropType<PerAxis>,
    /** What the value of each axis means, or one for both. */
    ariaValuetext: [String, Object] as PropType<PerAxis>,
  },
  emits: {
    'update:modelValue': (value: PointPosition) => typeof value === 'object',
    dragStart: (value: PointPosition) => typeof value === 'object',
    dragEnd: (value: PointPosition) => typeof value === 'object',
  },
  setup(props, { slots, attrs, emit }) {
    const points = usePointsEditorContext()
    checkPlacement('PointsEditorPoint', 'PointsEditorContainer')

    const generatedId = useId()
    const id = computed(() => props.id ?? generatedId)
    const disabled = computed(() => props.disabled ?? points.disabled)
    const readonly = computed(() => props.readonly ?? points.readonly)
    const inactive = computed(() => disabled.value || readonly.value)
    const wheel = computed(() =>
      props.wheel === undefined ? points.wheel : props.wheel,
    )
    const keyboard = computed(() =>
      props.keyboard === undefined ? points.keyboard : props.keyboard,
    )
    const current = computed(() =>
      clampPoint(props.modelValue, props.min, props.max),
    )

    const el = ref<HTMLDivElement | null>(null)
    const x = ref<HTMLInputElement | null>(null)
    const dragging = ref(false)

    // Read by the editor whenever it moves the selection, so the value can
    // change on every frame of a drag without registering again.
    const read = (): PointRegistration => ({
      value: props.modelValue,
      min: props.min,
      max: props.max,
      readonly: inactive.value,
      onChange: (next) => emit('update:modelValue', next),
      element: el.value,
      wheel: wheel.value,
    })
    watch(
      id,
      (key, _, onCleanup) => onCleanup(points.editor.registerPoint(key, read)),
      { immediate: true },
    )

    /** Where the pointer was when the drag started. */
    let origin: PointPosition | null = null

    watch(
      el,
      (element, _, onCleanup) => {
        if (!element) return
        // The value is the position itself: no scaling, and no rounding.
        const drag = createDragValue(element, {
          axis: POINT_AXIS,
          mapping: elementMapping(() => points.container, {
            sensitivity: (state) =>
              selectModifier(points.dragSensitivity, state.event).value,
          }),
          cursor: inactive.value ? undefined : points.cursor,
          shouldStart: () => !disabled.value,
          // A move rather than a position: the point keeps the offset it was
          // grabbed at, and everything else selected moves with it.
          onChange: ([px, py]) => {
            if (origin) {
              points.editor.movePointDrag({
                x: px - origin.x,
                y: py - origin.y,
              })
            }
          },
          onDragStart: ([px, py], state) => {
            points.editor.beginPointDrag(id.value, state.event)
            origin = { x: px, y: py }
            dragging.value = true
            x.value?.focus()
            if (!inactive.value) emit('dragStart', current.value)
          },
          onDragEnd: () => {
            origin = null
            dragging.value = false
            if (!inactive.value) emit('dragEnd', current.value)
          },
        })
        const stop = watch(
          () => (inactive.value ? undefined : points.cursor),
          (cursor) => drag.update({ cursor }),
        )
        onCleanup(() => {
          stop()
          drag.destroy()
        })
      },
      { immediate: true, flush: 'post' },
    )

    function onInput(axis: 'x' | 'y', target: HTMLInputElement) {
      if (readonly.value) {
        target.value = String(current.value[axis])
        return
      }
      const delta = target.valueAsNumber - props.modelValue[axis]
      points.editor.nudgeSelection(id.value, {
        x: axis === 'x' ? delta : 0,
        y: axis === 'y' ? delta : 0,
      })
    }

    const input = (axis: 'x' | 'y') =>
      visuallyHiddenRangeInput({
        ref: axis === 'x' ? x : undefined,
        'data-axis': axis,
        value: current.value[axis],
        min: props.min?.[axis] ?? 0,
        max: props.max?.[axis] ?? 1,
        step: 'any',
        disabled: disabled.value,
        'aria-readonly': readonly.value,
        'aria-orientation': axis === 'x' ? 'horizontal' : 'vertical',
        'aria-label': perAxis(props.ariaLabel, axis) ?? axis,
        'aria-valuetext': perAxis(props.ariaValuetext, axis),
        onInput: (event: Event) =>
          onInput(axis, event.target as HTMLInputElement),
      })

    // The visual point has two values, so its semantics live on the two
    // range inputs inside it. tabindex -1 keeps the focus inside when a press
    // lands on the point itself.
    return () => {
      const { style, onFocus, onKeydown, ...rest } = attrs
      return h(
        'div',
        {
          ref: el,
          tabindex: -1,
          'data-disabled': disabled.value ? '' : undefined,
          'data-readonly': readonly.value ? '' : undefined,
          'data-dragging': dragging.value ? '' : undefined,
          'data-selected': points.selection.includes(id.value) ? '' : undefined,
          ...rest,
          style: [
            {
              position: 'absolute',
              translate: 'var(--translate, -50% -50%)',
              '--color': props.color,
            },
            style,
            {
              left: `${props.modelValue.x * 100}%`,
              top: `${props.modelValue.y * 100}%`,
            },
          ],
          // Merged with the caller's own, which run after these.
          ...mergeProps(
            {
              onFocus: (event: FocusEvent) => {
                // The point is not the control: what reaches it goes to the input.
                if (!disabled.value && event.target === event.currentTarget) {
                  x.value?.focus()
                }
              },
              onKeydown: (event: KeyboardEvent) => {
                // The key picks the axis, whichever input holds the focus. y grows
                // downwards, so ArrowUp moves the point towards 0.
                const move = arrowKeyMove(event.key)
                if (!move) return
                event.preventDefault()
                if (inactive.value || !keyboard.value) return
                points.editor.nudgePoint(
                  id.value,
                  move.axis === 0 ? 'x' : 'y',
                  move.direction,
                  keyboard.value,
                  event,
                )
              },
            },
            { onFocus, onKeydown },
          ),
        },
        [input('x'), input('y'), slots.default?.()],
      )
    }
  },
})
