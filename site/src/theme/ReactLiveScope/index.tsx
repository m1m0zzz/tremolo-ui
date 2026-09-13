import React from 'react'
import * as Tone from 'tone'

import * as functions from '@tremolo-ui/functions'
import * as tremoloUI from '@tremolo-ui/react'

import myKnob from '@site/examples/tutorials/styling/my-knob.module.css'
import sliderTheme from 'shared/css/Slider.module.css'

// Add react-live imports you need here
const ReactLiveScope: unknown = {
  React,
  ...React,
  ...tremoloUI,
  ...functions,
  Tone,
  myKnob,
  // The demo theme, which the examples wire up by hand. Their `import` line is
  // there to be read: the code runs against this scope.
  sliderTheme,
}

export default ReactLiveScope
