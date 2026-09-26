import { defineComponent, h } from 'vue'

import { useFileInputContext } from './context'

/**
 * Opens the file picker and names the input. A `<label>` rather than a
 * button: the browser forwards the click, the input stays the one thing in
 * the tab order, and its name comes from this text.
 */
export const FileInputTrigger = /* @__PURE__ */ defineComponent({
  name: 'FileInputTrigger',
  setup(_, { slots }) {
    const fileInput = useFileInputContext()
    return () =>
      h(
        'label',
        {
          for: fileInput.inputId,
          'data-disabled': fileInput.disabled ? '' : undefined,
        },
        slots.default?.(),
      )
  },
})
