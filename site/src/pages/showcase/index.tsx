import adsrTsx from '!!raw-loader!@site/showcase/adsr/ADSR.tsx'
import envelopeTs from '!!raw-loader!@site/showcase/adsr/envelope.ts'
import djFilterPadTsx from '!!raw-loader!@site/showcase/dj-filter-pad/DJFilterPad.tsx'
import bandsTs from '!!raw-loader!@site/showcase/parametric-eq/bands.ts'
import parametricEqTsx from '!!raw-loader!@site/showcase/parametric-eq/ParametricEQ.tsx'
import realisticKnobsTsx from '!!raw-loader!@site/showcase/realistic-knobs/RealisticKnobs.tsx'
import audioSourceTsx from '!!raw-loader!@site/showcase/shared/AudioSource.tsx'
import demoLoopTs from '!!raw-loader!@site/showcase/shared/demo-loop.ts'
import segmentsTsx from '!!raw-loader!@site/showcase/shared/Segments.tsx'
import stageCornerTs from '!!raw-loader!@site/showcase/shared/stage-corner.ts'
import volumeFaderTsx from '!!raw-loader!@site/showcase/volume-fader/VolumeFader.tsx'
import wsADSRTsx from '!!raw-loader!@site/showcase/wavetable-synth/ADSR.tsx'
import wsAtomsTs from '!!raw-loader!@site/showcase/wavetable-synth/atoms.ts'
import wsKeyboardSectionTsx from '!!raw-loader!@site/showcase/wavetable-synth/KeyboardSection.tsx'
import wsMasterSectionTsx from '!!raw-loader!@site/showcase/wavetable-synth/MasterSection.tsx'
import wsSpectrumAnalyzerTsx from '!!raw-loader!@site/showcase/wavetable-synth/SpectrumAnalyzer.tsx'
import wsVolumeMeterTsx from '!!raw-loader!@site/showcase/wavetable-synth/VolumeMeter.tsx'
import wsWaveSelectorTsx from '!!raw-loader!@site/showcase/wavetable-synth/WaveSelector.tsx'
import wsWavetableTs from '!!raw-loader!@site/showcase/wavetable-synth/wavetable.ts'
import wsWavetableSynthTsx from '!!raw-loader!@site/showcase/wavetable-synth/WavetableSynth.tsx'
import Translate, { translate } from '@docusaurus/Translate'
import { ADSR } from '@site/showcase/adsr/ADSR'
import { DJFilterPad } from '@site/showcase/dj-filter-pad/DJFilterPad'
import { ParametricEQ } from '@site/showcase/parametric-eq/ParametricEQ'
import { RealisticKnobs } from '@site/showcase/realistic-knobs/RealisticKnobs'
import { VolumeFader } from '@site/showcase/volume-fader/VolumeFader'
import { WavetableSynth } from '@site/showcase/wavetable-synth/WavetableSynth'
import { ShowcaseItem, type ShowcaseFile } from '@site/src/components/Showcase'
import Heading from '@theme/Heading'
import Layout from '@theme/Layout'

import adsrCss from '!!raw-loader!@site/showcase/adsr/ADSR.module.css'
import djFilterPadCss from '!!raw-loader!@site/showcase/dj-filter-pad/DJFilterPad.module.css'
import parametricEqCss from '!!raw-loader!@site/showcase/parametric-eq/ParametricEQ.module.css'
import realisticKnobsCss from '!!raw-loader!@site/showcase/realistic-knobs/RealisticKnobs.module.css'
import audioSourceCss from '!!raw-loader!@site/showcase/shared/AudioSource.module.css'
import segmentsCss from '!!raw-loader!@site/showcase/shared/Segments.module.css'
import volumeFaderCss from '!!raw-loader!@site/showcase/volume-fader/VolumeFader.module.css'
import wsADSRCss from '!!raw-loader!@site/showcase/wavetable-synth/ADSR.module.css'
import wsFlushedNumberInputCss from '!!raw-loader!@site/showcase/wavetable-synth/FlushedNumberInput.module.css'
import wsKeyboardSectionCss from '!!raw-loader!@site/showcase/wavetable-synth/KeyboardSection.module.css'
import wsMasterSectionCss from '!!raw-loader!@site/showcase/wavetable-synth/MasterSection.module.css'
import wsWavetableSynthCss from '!!raw-loader!@site/showcase/wavetable-synth/WavetableSynth.module.css'
import styles from './index.module.css'

/** What the demos that play audio share: the transport and the loop. */
const audioSourceFiles: ShowcaseFile[] = [
  { name: 'AudioSource.tsx', code: audioSourceTsx },
  { name: 'AudioSource.module.css', code: audioSourceCss },
  { name: 'demo-loop.ts', code: demoLoopTs },
  { name: 'stage-corner.ts', code: stageCornerTs },
]

export default function Showcase() {
  return (
    <Layout
      title={translate({ id: 'showcase.title', message: 'Showcase' })}
      description={translate({
        id: 'showcase.description',
        message:
          'Audio interfaces built with tremolo-ui, running in the browser.',
      })}
    >
      <main className="container">
        <header className={styles.header}>
          <Heading as="h1">
            <Translate id="showcase.title">Showcase</Translate>
          </Heading>
          <p className={styles.lead}>
            <Translate id="showcase.lead">
              Take a look at components built with tremolo-ui and React.
              tremolo-ui is headless: it brings the behaviour and leaves the CSS
              to you, so you can build on the components below and style them
              however you like.
            </Translate>
          </p>
        </header>
        <div className={styles.grid}>
          <ShowcaseItem
            id="parametric-eq"
            title="Parametric EQ"
            description={
              <Translate id="showcase.parametric-eq.description">
                Eight bands, each switched on or off and set to a bell, shelf,
                pass or notch. Drag a band to set its frequency and gain, drag
                across empty space to select several, and Alt + drag for the Q.
                The curve is the response of real BiquadFilterNodes, drawn over
                the spectrum of what is playing.
              </Translate>
            }
            components={['PointsEditor', 'AnimationCanvas', 'Knob']}
            files={[
              { name: 'ParametricEQ.tsx', code: parametricEqTsx },
              { name: 'bands.ts', code: bandsTs },
              { name: 'ParametricEQ.module.css', code: parametricEqCss },
              ...audioSourceFiles,
            ]}
            wide
          >
            {() => <ParametricEQ />}
          </ShowcaseItem>
          <ShowcaseItem
            id="wavetable-synth"
            title="Wavetable Synth"
            description={
              <Translate id="showcase.wavetable-synth.description">
                A polyphonic synth to play with the mouse, the computer keyboard
                or a MIDI keyboard. Morph the wave from sine to square, shape
                the envelope and stack detuned voices.
              </Translate>
            }
            components={[
              'Slider',
              'Knob',
              'NumberInput',
              'Piano',
              'AnimationCanvas',
            ]}
            files={[
              { name: 'WavetableSynth.tsx', code: wsWavetableSynthTsx },
              { name: 'WaveSelector.tsx', code: wsWaveSelectorTsx },
              { name: 'ADSR.tsx', code: wsADSRTsx },
              { name: 'MasterSection.tsx', code: wsMasterSectionTsx },
              { name: 'KeyboardSection.tsx', code: wsKeyboardSectionTsx },
              { name: 'SpectrumAnalyzer.tsx', code: wsSpectrumAnalyzerTsx },
              { name: 'VolumeMeter.tsx', code: wsVolumeMeterTsx },
              { name: 'atoms.ts', code: wsAtomsTs },
              { name: 'wavetable.ts', code: wsWavetableTs },
              { name: 'WavetableSynth.module.css', code: wsWavetableSynthCss },
              { name: 'ADSR.module.css', code: wsADSRCss },
              { name: 'MasterSection.module.css', code: wsMasterSectionCss },
              {
                name: 'KeyboardSection.module.css',
                code: wsKeyboardSectionCss,
              },
              {
                name: 'FlushedNumberInput.module.css',
                code: wsFlushedNumberInputCss,
              },
            ]}
            wide
          >
            {() => <WavetableSynth />}
          </ShowcaseItem>
          <ShowcaseItem
            id="realistic-knobs"
            title="Realistic Knobs"
            description={
              <Translate id="showcase.realistic-knobs.description">
                Three kinds of hardware knob on a drive pedal: machined
                aluminium, a bakelite pointer and an LED ring. The knob only
                reports its angle; every surface is CSS.
              </Translate>
            }
            components={['Knob']}
            files={[
              { name: 'RealisticKnobs.tsx', code: realisticKnobsTsx },
              { name: 'RealisticKnobs.module.css', code: realisticKnobsCss },
              { name: 'Segments.tsx', code: segmentsTsx },
              { name: 'Segments.module.css', code: segmentsCss },
              ...audioSourceFiles,
            ]}
          >
            {() => <RealisticKnobs />}
          </ShowcaseItem>
          <ShowcaseItem
            id="adsr"
            title="ADSR Envelope"
            description={
              <Translate id="showcase.adsr.description">
                Drag the handles or turn the knobs, then play the keys: the dot
                follows the note along the envelope, attack to release.
              </Translate>
            }
            components={['PointsEditor', 'AnimationCanvas', 'Knob', 'Piano']}
            files={[
              { name: 'ADSR.tsx', code: adsrTsx },
              { name: 'envelope.ts', code: envelopeTs },
              { name: 'ADSR.module.css', code: adsrCss },
            ]}
          >
            {() => <ADSR />}
          </ShowcaseItem>
          <ShowcaseItem
            id="dj-filter-pad"
            title="DJ Filter Pad"
            description={
              <Translate id="showcase.dj-filter-pad.description">
                Hold the pad and sweep left for a lowpass, right for a highpass,
                up and down for the resonance. Let go and it springs back to the
                centre.
              </Translate>
            }
            components={['XYPad']}
            files={[
              { name: 'DJFilterPad.tsx', code: djFilterPadTsx },
              { name: 'DJFilterPad.module.css', code: djFilterPadCss },
              ...audioSourceFiles,
            ]}
          >
            {() => <DJFilterPad />}
          </ShowcaseItem>
          <ShowcaseItem
            id="volume-fader"
            title="Volume Fader"
            description={
              <Translate id="showcase.volume-fader.description">
                A long-throw fader with a stereo LED meter on the same scale.
                Double-click the cap to go back to 0 dB.
              </Translate>
            }
            components={['Slider', 'AnimationCanvas']}
            files={[
              { name: 'VolumeFader.tsx', code: volumeFaderTsx },
              { name: 'VolumeFader.module.css', code: volumeFaderCss },
              { name: 'Segments.tsx', code: segmentsTsx },
              { name: 'Segments.module.css', code: segmentsCss },
              ...audioSourceFiles,
            ]}
          >
            {() => <VolumeFader />}
          </ShowcaseItem>
        </div>
      </main>
    </Layout>
  )
}
