import knobModule from '!!raw-loader!shared/css/Knob.module.css'
import numberInputModule from '!!raw-loader!shared/css/NumberInput.module.css'
import pianoModule from '!!raw-loader!shared/css/Piano.module.css'
import pointsEditorModule from '!!raw-loader!shared/css/PointsEditor.module.css'
import sliderModule from '!!raw-loader!shared/css/Slider.module.css'
import xyPadModule from '!!raw-loader!shared/css/XYPad.module.css'

/**
 * The demo theme, by the file name each part is copied as. The example decides
 * which of them it imports.
 */
export const themeModules: Record<string, string> = {
  'Knob.module.css': knobModule,
  'NumberInput.module.css': numberInputModule,
  'Piano.module.css': pianoModule,
  'PointsEditor.module.css': pointsEditorModule,
  'Slider.module.css': sliderModule,
  'XYPad.module.css': xyPadModule,
}
