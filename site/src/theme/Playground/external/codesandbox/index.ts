// @ts-nocheck
import { getParameters } from 'codesandbox-import-utils/lib/api/define'

import { files } from './files'

// https://codesandbox.io/docs/learn/sandboxes/cli-api

export function generateCodeSandboxUrl(code: string) {
  // console.log('hello')
  const parameters = getParameters({
    files: {
      'src/App.tsx': {
        content: code,
      },
      ...files,
    },
  })
  return `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}`
}
