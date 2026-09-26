import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Read by Storybook, which builds with the project's own Vite config. The
// components are render functions and need no plugin; the framework does.
export default defineConfig({
  plugins: [vue()],
})
