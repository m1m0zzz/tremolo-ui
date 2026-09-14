# Next.js + TypeScript + tremolo-ui

A starting point for an audio app with [tremolo-ui](https://tremolo-ui.mimoz.dev/),
on the Next.js App Router.

## Getting started

```bash
npx degit m1m0zzz/tremolo-ui/templates/next-ts my-app
cd my-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What is in it

- `src/app/Components.tsx` — one of each component, wired up to the theme. Start
  editing here. The components hold state and handle input, so the file is a
  Client Component (`'use client'`).
- `src/theme/` — the theme the documentation uses. **tremolo-ui ships no CSS**,
  so these files are yours: change them, replace them, or delete the ones you do
  not use. [Styling](https://tremolo-ui.mimoz.dev/docs/tutorials/styling/)
  explains how they work.

## Learn more

- [Documentation](https://tremolo-ui.mimoz.dev/)
- [Storybook](https://tremolo-ui.mimoz.dev/i/storybook-react/)
- [Next.js](https://nextjs.org/docs)
