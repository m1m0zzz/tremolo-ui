import React from 'react';
import { AnimationCanvas, Knob, NumberInput, Slider } from '@tremolo-ui/react'

// Add react-live imports you need here
const ReactLiveScope: unknown = {
  React,
  ...React,
  AnimationCanvas,
  Knob,
  NumberInput,
  Slider,
};

export default ReactLiveScope;
