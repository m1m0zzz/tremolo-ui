import React from 'react'
import * as tremoloUI from '@tremolo-ui/react'
import * as functions from '@tremolo-ui/functions'
import * as Tone from 'tone'

import myKnob from '@site/examples/tutorials/styling/my-knob.module.css'

// Add react-live imports you need here
const ReactLiveScope: unknown = {
  React,
  ...React,
  ...tremoloUI,
  ...functions,
  Tone,
  myKnob,
}

export default ReactLiveScope
