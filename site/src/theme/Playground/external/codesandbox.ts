// @ts-nocheck
import { getParameters } from "codesandbox-import-utils/lib/api/define";

import { packageJSON, indexJs, indexHtml } from "./files";

// https://codesandbox.io/docs/learn/sandboxes/cli-api

export function generateCodeSandboxUrl(code: string) {
  const parameters = getParameters({
    files: {
      "package.json": {
        content: packageJSON
      },
      "src/index.js": {
        content: indexJs
      },
      "src/App.js": {
        content: code
      },
      "public/index.html": {
        content: indexHtml
      }
    },
  })
  return `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}`;
}
