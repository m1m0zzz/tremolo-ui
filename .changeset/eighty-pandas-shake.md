---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
---

Build out the MIDI input: every channel voice message, the channel they arrived on, and devices that come and go.

Three bugs came out of it:

- **A device plugged in after permission was granted never worked.** `createMIDIMessage` took the input list once, when it was created, so a keyboard connected later got no listener and stayed silent until the component remounted. The device list is now followed through `statechange`.
- **Pitch bend reported its two bytes the wrong way round.** `onPitchBendEvent(msb, lsb)` was handed `(data[1], data[2])`, but pitch bend sends the low 7 bits first — the opposite order from every other message.
- **`useMIDIInput` and `useMIDIMessage` resubscribed on every render.** The handlers were effect dependencies, so writing one inline tore the listeners down and built them again each time. They are read fresh on every event now, and the listeners stay put.

Beyond note on/off and pitch bend, `createMIDIInput` now decodes control change, program change, polyphonic aftertouch and channel pressure. Every handler is given the channel last, as 0-15.

```jsx
useMIDIInput(midiAccess, {
  onNoteOnEvent: (note, velocity, channel) => play(note, velocity / 127),
  onNoteOffEvent: (note) => stop(note),
  onControlChangeEvent: (controller, value) => {
    if (controller === 1) setModulation(value / 127)
  },
})
```

`createMIDIAccess` gained the rest of what a device UI needs: `inputs` in its state, kept current as devices come and go; `request({ sysex: true })` for system exclusive; and errors told apart rather than flattened — `SecurityError` and `NotAllowedError` become `PERMISSION_DENIED`, `NotSupportedError` becomes `NOT_SUPPORTED`, and everything else becomes the new `UNAVAILABLE`. A user who said no can be asked again; a browser without the API cannot.

Breaking changes:

- `useMIDIInput(access, onNoteOn, onNoteOff, onPitchBend)` takes a handlers object instead: `useMIDIInput(access, { onNoteOnEvent, onNoteOffEvent, ... })`. Seven handlers do not fit in positional arguments
- `onPitchBendEvent` is `(value, channel)`, where `value` is the 14-bit bend 0-16383, centred at the new `PITCH_BEND_CENTER` (8192), rather than the two raw bytes
- `useMIDIAccess().request` takes options, so `onClick={request}` has to become `onClick={() => request()}` — otherwise the click event arrives as the options object
