import knob from '!!raw-loader!@site/src/css/tremolo/Knob.css'
import numberInput from '!!raw-loader!@site/src/css/tremolo/NumberInput.css'
import piano from '!!raw-loader!@site/src/css/tremolo/Piano.css'
import pointsEditor from '!!raw-loader!@site/src/css/tremolo/PointsEditor.css'
import xyPad from '!!raw-loader!@site/src/css/tremolo/XYPad.css'
import sliderModule from '!!raw-loader!shared/css/Slider.module.css'

/** The parts still shipped as one global stylesheet. */
export const themeCss = [knob, numberInput, piano, pointsEditor, xyPad].join(
  '\n',
)

/** The parts that have moved to CSS Modules, by the file name they are copied as. */
export const themeModules: Record<string, string> = {
  'Slider.module.css': sliderModule,
}
