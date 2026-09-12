import sdk from '@stackblitz/sdk'

import { createFiles } from './files'

// https://developer.stackblitz.com/platform/api/javascript-sdk

export function openStackblitz(
  code: string,
  tremoloUIVersion: string,
  additionalFiles: Record<string, string> = {},
) {
  const files = createFiles(tremoloUIVersion)
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
