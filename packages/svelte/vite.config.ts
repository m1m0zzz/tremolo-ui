import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// Read by Storybook, which compiles .svelte with the project's own Vite
// config. The tests have theirs in vitest.config.ts.
export default defineConfig({
  plugins: [svelte()],
})
