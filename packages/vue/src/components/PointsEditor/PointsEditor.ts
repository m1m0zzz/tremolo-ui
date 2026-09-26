import {
  computed,
  defineComponent,
  h,
  onScopeDispose,
  provide,
  shallowRef,
  watchEffect,
  type PropType,
} from 'vue'

import {
  createPointsEditor,
  DEFAULT_DRAG_SENSITIVITY,
  POINTS_EDITOR_DEFAULT_KEYBOARD,
  POINTS_EDITOR_DEFAULT_WHEEL,
  type InputEventOption,
  type ModifierValue,
  type SelectionBoxRect,
} from '@tremolo-ui/dom'

import { PointsEditorKey } from './context'

const EMPTY: readonly string[] = []

/**
 * Multiple point controller. Bind the selection with `v-model:selection` to
 * hold it yourself; the editor keeps its own otherwise.
 */
export const PointsEditor = /* @__PURE__ */ defineComponent({
  name: 'PointsEditor',
  props: {
    /** Make the points unchangeable and remove them from the tab order. */
    disabled: Boolean,
    /** Make the points unmovable. */
    readonly: Boolean,
    /** The cursor to show while dragging a point. @default { cursor: 'grabbing' } */
    externalStyles: Object as PropType<{ cursor?: string }>,
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
  },
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
      get cursor() {
        return props.externalStyles?.cursor ?? 'grabbing'
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
