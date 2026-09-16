---
'@tremolo-ui/react': minor
---

**`UseDragOptions` is exported.** The options of `useDrag` had no name you
could import, unlike `useWheel` and `useDragValue`.

```ts
import { useDrag, type UseDragOptions } from '@tremolo-ui/react'
```

**`UseWheelOptions` no longer has `onWheel`.** It inherited the option from
`WheelOptions`, where it exists so that `createWheel` can replace the callback
through `update()`. `useWheel` takes the handler as its first argument, so
anything passed in the options was silently ignored.

The options of all three hooks are documented on their own pages now, with the
descriptions coming from the JSDoc.
