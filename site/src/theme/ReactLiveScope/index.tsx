import React from 'react'
import * as tremoloUI from '@tremolo-ui/react'
import * as functions from '@tremolo-ui/functions'

// Add react-live imports you need here
const ReactLiveScope: unknown = {
  React,
  ...React,
  ...tremoloUI,
  ...functions,
}

export default ReactLiveScope
