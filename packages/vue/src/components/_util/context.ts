import { inject, type InjectionKey } from 'vue'

/** Read a component's context, or explain which parent is missing. */
export function injectContext<T>(key: InjectionKey<T>, parent: string): T {
  const context = inject(key, null)
  if (!context) throw new Error(`Missing ${parent} in the tree`)
  return context
}
