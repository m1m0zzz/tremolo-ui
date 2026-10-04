import {
  type ComponentObjectPropsOptions,
  computed,
  defineComponent,
  type ExtractPublicPropTypes,
  h,
  onScopeDispose,
  type PropType,
  provide,
  shallowRef,
  watchEffect,
} from 'vue'

import {
  createPointsEditor,
  DEFAULT_DRAG_SENSITIVITY,
  type InputEventOption,
  type ModifierValue,
  type SelectionBoxRect,
} from '@tremolo-ui/dom'
import {
  POINTS_EDITOR_DEFAULT_KEYBOARD,
  POINTS_EDITOR_DEFAULT_WHEEL,
} from '@tremolo-ui/dom/internal'

import { PointsEditorKey } from './context'

const EMPTY: readonly string[] = []

const pointsEditorProps = {
  /** Make the points unchangeable and remove them from the tab order. */
  disabled: Boolean,
  /** Make the points unmovable. */
  readonly: Boolean,
  /** The cursor to show while dragging a point. @default 'grabbing' */
  dragCursor: { type: String, default: 'grabbing' },
  /** How much one wheel notch moves the focused point. */
  wheel: {
    type: [Array, Object] as PropType<ModifierValue<InputEventOption> | null>,
    default: () => POINTS_EDITOR_DEFAULT_WHEEL,
  },
  /** How much one arrow key press moves a point. */
  keyboard: {
    type: [Array, Object] as PropType<ModifierValue<InputEventOption> | null>,
    default: () => POINTS_EDITOR_DEFAULT_KEYBOARD,
  },
  /** How much a drag moves a point, per modifier key. */
  dragSensitivity: {
    type: [Number, Object] as PropType<ModifierValue<number>>,
    default: () => DEFAULT_DRAG_SENSITIVITY,
  },
  /**
   * Let points be selected, and a selection be moved as one. A selection
   * updates several points in the same tick.
   */
  selectable: Boolean,
  /** Ids of the selected points. Bind it with `v-model:selection`. */
  selection: Array as PropType<string[]>,
} satisfies ComponentObjectPropsOptions

export type PointsEditorProps = ExtractPublicPropTypes<typeof pointsEditorProps>

/**
 * Multiple point controller. Bind the selection with `v-model:selection` to
 * hold it yourself; the editor keeps its own otherwise.
 */
export const PointsEditor = /* @__PURE__ */ defineComponent({
  name: 'PointsEditor',
  props: pointsEditorProps,
  emits: {
    'update:selection': (selection: string[]) => Array.isArray(selection),
  },
  setup(props, { slots, emit }) {
    const ownSelection = shallowRef<string[]>(props.selection ?? [])
    const selectionBox = shallowRef<SelectionBoxRect | null>(null)
    const container = shallowRef<HTMLElement | null>(null)

    // Nothing is selected while selection is off, so a drag picks up only
    // the point it started on.
    const current = computed(() =>
      props.selectable ? (props.selection ?? ownSelection.value) : EMPTY,
    )

    // The selection lives here, where Vue state can hold it; which points a
    // press or a box selects, and how a selection moves, is the core's.
    const editor = createPointsEditor({
      onSelectionBoxChange: (rect) => {
        selectionBox.value = rect
      },
      onSelectionChange: (next) => {
        ownSelection.value = next
        emit('update:selection', next)
      },
    })
    watchEffect(
      () =>
        editor.update({
          selectable: props.selectable,
          selection: current.value,
        }),
      { flush: 'sync' },
    )
    onScopeDispose(() => editor.destroy())

    provide(PointsEditorKey, {
      get disabled() {
        return props.disabled
      },
      get readonly() {
        return props.readonly
      },
      get wheel() {
        return props.wheel
      },
      get keyboard() {
        return props.keyboard
      },
      get dragSensitivity() {
        return props.dragSensitivity
      },
      get dragCursor() {
        return props.dragCursor
      },
      get selectable() {
        return props.selectable
      },
      get selection() {
        return current.value
      },
      get selectionBox() {
        return selectionBox.value
      },
      get container() {
        return container.value
      },
      editor,
      setContainer: (element) => {
        container.value = element
      },
    })

    // The layers inside are placed against this box.
    return () =>
      h(
        'div',
        {
          'data-disabled': props.disabled ? '' : undefined,
          'data-readonly': props.readonly ? '' : undefined,
          style: { position: 'relative' },
        },
        slots.default?.(),
      )
  },
})
