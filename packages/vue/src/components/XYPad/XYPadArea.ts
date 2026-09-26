import { defineComponent, h, onBeforeUnmount, ref, watchEffect } from 'vue'

import { providePlacement } from '../_util/placement'

import { useXYPadContext } from './context'

/** The area the thumb moves in, and what the pointer is measured against. */
export const XYPadArea = /* @__PURE__ */ defineComponent({
  name: 'XYPadArea',
  setup(_, { slots }) {
    const pad = useXYPadContext()
    providePlacement('XYPadArea')
    const el = ref<HTMLDivElement | null>(null)
    watchEffect(() => pad.setArea(el.value))
    onBeforeUnmount(() => pad.setArea(null))
    // The thumb inside is placed against this box.
    return () =>
      h('div', { ref: el, style: { position: 'relative' } }, slots.default?.())
  },
})
