---
'@tremolo-ui/react': minor
---

Keep the `useAnimationFrame` loop running across renders when the callback is written inline. The callback is now read through a ref, so only the `deps` given to the hook restart the loop — an inline callback that renders no longer cancels and re-schedules its own loop on every frame.
