// @ts-nocheck
import { getParameters } from 'codesandbox-import-utils/lib/api/define'

import { files } from './files'

// https://codesandbox.io/docs/learn/sandboxes/cli-api

export function generateCodeSandboxUrl(
  code: string,
  additionalFiles: Record<string, string> = {},
) {
  // console.log('hello')
  const parameters = getParameters({
    files: {
      ...Object.fromEntries(
        Object.entries(additionalFiles).map(([path, content]) => [
          path,
          { content },
        ]),
      ),
      ...files,
      'src/App.tsx': {
        content: code,
      },
    },
  })
  return `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}`
}
