import numberInput from '!!raw-loader!@site/src/css/tremolo/NumberInput.css'
import piano from '!!raw-loader!@site/src/css/tremolo/Piano.css'
import pointsEditor from '!!raw-loader!@site/src/css/tremolo/PointsEditor.css'
import knobModule from '!!raw-loader!shared/css/Knob.module.css'
import sliderModule from '!!raw-loader!shared/css/Slider.module.css'
import xyPadModule from '!!raw-loader!shared/css/XYPad.module.css'

/** The parts still shipped as one global stylesheet. */
export const themeCss = [numberInput, piano, pointsEditor].join('\n')

/** The parts that have moved to CSS Modules, by the file name they are copied as. */
export const themeModules: Record<string, string> = {
  'Knob.module.css': knobModule,
  'Slider.module.css': sliderModule,
  'XYPad.module.css': xyPadModule,
}
