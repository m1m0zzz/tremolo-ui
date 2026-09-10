import sdk from '@stackblitz/sdk'

import { files } from './files'

// https://developer.stackblitz.com/platform/api/javascript-sdk

export function openStackblitz(
  code: string,
  additionalFiles: Record<string, string> = {},
) {
  sdk.openProject(
    {
      title: 'tremolo-ui react example',
      description: 'Blank starter project for building ES6 apps.',
      template: 'node',
      files: { ...additionalFiles, ...files, 'src/App.tsx': code },
      settings: {
        compile: {
          trigger: 'auto',
          clearConsole: false,
        },
      },
    },
    {
      newWindow: true,
      openFile: ['src/App.tsx'],
    },
  )
}
