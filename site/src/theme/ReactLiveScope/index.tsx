import React from 'react'
import * as tremoloUI from '@tremolo-ui/react'
import * as functions from '@tremolo-ui/functions'

import myKnob from '@site/examples/tutorials/react/styling/my-knob.module.css'

// Add react-live imports you need here
const ReactLiveScope: unknown = {
  React,
  ...React,
  ...tremoloUI,
  ...functions,
  myKnob,
}

export default ReactLiveScope
