// `import.meta.env.BASE_URL` — Storybook builds with a base of /i/storybook-react/
// (.storybook/main.ts), so stories that point at a file in __stories__/public
// have to prefix it. This also supplies the CSS module declarations used only
// by stories, keeping those ambient declarations out of the published `src`.
// A reference rather than `compilerOptions.types`, for the same reason as
// vitest.d.ts.
/// <reference types="vite/client" />
