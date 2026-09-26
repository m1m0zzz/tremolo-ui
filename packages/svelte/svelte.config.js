import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
export default {
  // TypeScript in `<script lang="ts">`. svelte-package reads this too.
  preprocess: vitePreprocess(),
}
