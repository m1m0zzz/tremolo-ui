import * as Tone from 'tone'

const BPM = 120
const BARS = 2
/** How long the loop is, in seconds: two bars of 4/4. */
const LENGTH = (BARS * 4 * 60) / BPM

/** The harmony, a chord per half bar, and the bass note under each. */
const CHORDS: [string, string[], string][] = [
  ['0:0', ['A3', 'C4', 'E4'], 'A1'],
  ['0:2', ['F3', 'A3', 'C4'], 'F1'],
  ['1:0', ['C4', 'E4', 'G4'], 'C2'],
  ['1:2', ['G3', 'B3', 'D4'], 'G1'],
]

let rendered: Promise<Tone.ToneAudioBuffer> | null = null

/**
 * A two-bar loop of drums, bass and chords to play through the demos.
 *
 * Rendered once, offline, rather than played live: every demo then loops the
 * same buffer on a player of its own, and none of them has to share the
 * transport with the others.
 */
export function demoLoop() {
  rendered ??= Tone.Offline(({ transport }) => {
    transport.bpm.value = BPM

    const kick = new Tone.MembraneSynth({ volume: -6 }).toDestination()
    const snare = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
      volume: -16,
    }).toDestination()
    const hat = new Tone.NoiseSynth({
      envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
      volume: -24,
    }).connect(new Tone.Filter(7000, 'highpass').toDestination())
    const bass = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.1 },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.15,
        sustain: 0.3,
        baseFrequency: 200,
        octaves: 3,
      },
      volume: -14,
    }).toDestination()
    // Bright on purpose: a filter or an EQ has more to work on.
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 24 },
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 0.3 },
      volume: -24,
    }).toDestination()

    new Tone.Sequence(
      (time) => kick.triggerAttackRelease('C1', '8n', time),
      [0, 0, 0, 0],
      '4n',
    ).start(0)
    new Tone.Sequence(
      (time, hit) => hit && snare.triggerAttackRelease('16n', time),
      [false, true, false, true],
      '4n',
    ).start(0)
    new Tone.Sequence(
      (time, hit) => hit && hat.triggerAttackRelease('32n', time),
      [false, true, false, true, false, true, true, true],
      '8n',
    ).start(0)
    new Tone.Part(
      (time, [, chord, root]) => {
        pad.triggerAttackRelease(chord, '2n', time)
        // Eighths on the root, every other one an octave up.
        for (let i = 0; i < 4; i++) {
          const note = Tone.Frequency(root).transpose(i % 2 ? 12 : 0)
          bass.triggerAttackRelease(
            note.toNote(),
            '16n',
            time + i * (60 / BPM / 2),
          )
        }
      },
      CHORDS.map((event) => [event[0], event] as const),
    ).start(0)

    transport.start()
  }, LENGTH)
  return rendered
}
