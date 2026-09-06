import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // describe / test / expect / vi as globals, the way jest had them. It is
    // also what makes Testing Library clean up on its own in the other
    // packages: it looks for a global afterEach and installs itself there.
    globals: true,
    // Nothing here touches the DOM, so it does not pay for jsdom.
    environment: 'node',
  },
})
