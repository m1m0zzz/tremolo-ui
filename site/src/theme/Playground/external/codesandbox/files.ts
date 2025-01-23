const indexTs = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
`

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <noscript>
    You need to enable JavaScript to run this app.
  </noscript>
  <div id="root"></div>
</body>
</html>
`
const packageJSON = `{
  "name": "tremolo-ui-react-example",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.tsx",
  "dependencies": {
    "@tremolo-ui/react": "latest",
    "react": "^18.2.6",
    "react-dom": "^18.2.6"
  },
  "scripts": {
    "start": "react-scripts-ts start",
    "build": "react-scripts-ts build",
    "test": "react-scripts-ts test --env=jsdom",
    "eject": "react-scripts-ts eject"
  },
  "devDependencies": {
    "@types/react": "^18.2.6",
    "@types/react-dom": "^18.2.6",
    "react-scripts-ts": "latest"
  }
}
`

const tsconfigJson = `{
  "include": [
    "./src/**/*"
  ],
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "lib": [
      "dom",
      "es2015"
    ],
    "jsx": "react-jsx"
  }
}
`

export const files = {
  "public/index.html": {
    content: indexHtml
  },
  "src/index.tsx": {
    content: indexTs
  },
  "package.json": {
    content: packageJSON
  },
  "tsconfig.json": {
    content: tsconfigJson
  }
}
