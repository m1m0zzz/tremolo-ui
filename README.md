
# [tremolo-ui](https://github.com/m1m0zzz/tremolo-ui)

UI library for Web Audio App

[![Build Node.js](https://github.com/m1m0zzz/tremolo-ui/actions/workflows/build.yml/badge.svg)](https://github.com/m1m0zzz/tremolo-ui/actions/workflows/build.yml)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/tremolo-ui?logo=docusaurus&name=Docs)](https://tremolo-ui.vercel.app/)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/tremolo-ui-sb-react?logo=storybook&name=React)](https://tremolo-ui-sb-react.vercel.app/)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/tremolo-ui-sb-web-components?logo=storybook&name=Web+Components)](https://tremolo-ui-sb-web-components.vercel.app/)

*tremolo-ui is now WIP*

## 🚩 Goals

- Components with usability and flexibility
- Mobile Support
- Distribute package
  - React
  - Web Components


## 🧬 Installation

### React

Install tremolo-ui
```bash
npm install @tremolo-ui/react
```

And install dependencies

```bash
npm install react react-dom @emotion/react
```

```jsx
import { useState } from 'react'
import { Slider } from '@tremolo-ui/react'

function App() {
  const [value, setValue] = useState(0)

  return (
    <>
      <Slider
        value={value}
        min={0}
        max={100}
        onChange={(v) => setValue(v)}
      />
      <p>value: {value}</p>
    </>
  )
}
```

### Web Components

*draft now*

Install tremolo-ui
```bash
npm install @tremolo-ui/web-components
```

```html
<tremolo-slider value="32" min="0" max="100" />
```

## 📚 Docs

**Tutorial & API**

https://tremolo-ui.vercel.app/

**Storybook UI Catalog**

- [React](https://tremolo-ui-sb-react.vercel.app/)
- [Web Components](https://tremolo-ui-sb-web-components.vercel.app/)


## 🦝 Contributing
Please see [contribution guide](./CONTRIBUTING.md)

日本語版は [コントリビューション ガイド](./CONTRIBUTING.ja.md) を参照してください。

## 📜 LICENSE
tremolo-ui is [MIT License](./LICENSE)
