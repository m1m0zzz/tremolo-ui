import { defineComponent, h, provide, useId } from 'vue'

import { partitionByAccept, visuallyHiddenStyle } from '@tremolo-ui/dom'

import { FileInputKey } from './context'

/**
 * Picks files. The control is the native file input, out of sight but in the
 * tab order, with `FileInputTrigger` as its label.
 */
export const FileInput = /* @__PURE__ */ defineComponent({
  name: 'FileInput',
  inheritAttrs: false,
  props: {
    /**
     * Which files to take: extensions, MIME types and type groups. It is
     * checked again when the files arrive, since the picker only takes it as
     * a hint.
     */
    accept: String,
    /** Let several files be picked at once. */
    multiple: Boolean,
    /** Make the input unusable. The parts carry `data-disabled`. */
    disabled: Boolean,
  },
  emits: {
    /** The picked files that satisfy `accept`. */
    change: (files: File[]) => Array.isArray(files),
    /** The picked files that do not satisfy `accept`. */
    reject: (files: File[]) => Array.isArray(files),
  },
  setup(props, { slots, emit, attrs }) {
    const inputId = useId()
    provide(FileInputKey, {
      inputId,
      get disabled() {
        return props.disabled
      },
    })

    function onChange(event: Event) {
      const input = event.target as HTMLInputElement
      const { accepted, rejected } = partitionByAccept(
        Array.from(input.files ?? []),
        props.accept,
      )
      // Picking the same file twice fires no second change while the value
      // is still on the input, so it is cleared as soon as it is read.
      input.value = ''
      if (rejected.length > 0) emit('reject', rejected)
      if (accepted.length > 0) emit('change', accepted)
    }

    return () => {
      const {
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-describedby': ariaDescribedby,
        ...rest
      } = attrs
      return h(
        'div',
        { ...rest, 'data-disabled': props.disabled ? '' : undefined },
        [
          h('input', {
            id: inputId,
            type: 'file',
            accept: props.accept,
            multiple: props.multiple,
            disabled: props.disabled,
            style: visuallyHiddenStyle,
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabelledby,
            'aria-describedby': ariaDescribedby,
            onChange,
          }),
          slots.default?.(),
        ],
      )
    }
  },
})
