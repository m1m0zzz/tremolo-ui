import { defineComponent, h, ref } from 'vue'

import { useDropZone } from '../../composables/useDropZone'

/** A region that takes dropped files. */
export const DropZone = /* @__PURE__ */ defineComponent({
  name: 'DropZone',
  props: {
    /** Which files to take, as the `accept` attribute of a file input. */
    accept: String,
    /** Take every file dropped, rather than the first. */
    multiple: Boolean,
    /** Ignore drops. The zone carries `data-disabled`. */
    disabled: Boolean,
  },
  emits: {
    /** The dropped files that satisfy `accept`. */
    drop: (files: File[], _event: DragEvent) => Array.isArray(files),
    /** The dropped files that do not satisfy `accept`. */
    reject: (files: File[], _event: DragEvent) => Array.isArray(files),
  },
  setup(props, { slots, emit }) {
    const el = ref<HTMLDivElement | null>(null)
    const state = useDropZone(el, () => ({
      accept: props.accept,
      multiple: props.multiple,
      disabled: props.disabled,
      onDrop: (files, event) => emit('drop', files, event),
      onReject: (files, event) => emit('reject', files, event),
    }))
    return () =>
      h(
        'div',
        {
          ref: el,
          'data-dragover': state.value.over ? '' : undefined,
          'data-invalid': state.value.invalid ? '' : undefined,
          'data-disabled': props.disabled ? '' : undefined,
        },
        slots.default?.(),
      )
  },
})
