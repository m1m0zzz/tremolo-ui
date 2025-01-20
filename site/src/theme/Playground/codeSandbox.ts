// @ts-nocheck
import { getParameters } from "codesandbox/lib/api/define";

const indexJs = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
`

const html = `<!DOCTYPE html>
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


export function generateCodeSandboxUrl(code: string) {
  const parameters = getParameters({
    files: {
      "package.json": {
        content: {
          name: "tremolo-ui-react-example",
          version: "1.0.0",
          description: "",
          keywords: [],
          main: "src/index.tsx",
          dependencies: {
            "@tremolo-ui/react": "latest",
            "@emotion/react": "11.x",
            "react": "18.x",
            "react-dom": "18.x"
          },
          devDependencies: {
            "@types/react": "18.x",
            "@types/react-dom": "18.x",
            "typescript": "5.7.2"
          },
        }
      },
      "src/index.js": {
        content: indexJs
      },
      "src/App.js": {
        content: code
      },
      "public/index.html": {
        content: html
      }
    },
  })
  return `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}`;
}
