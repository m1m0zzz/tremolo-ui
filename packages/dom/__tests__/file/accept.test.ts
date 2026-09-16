import { matchesAccept } from '../../src/file/accept'

const wav = { name: 'loop.wav', type: 'audio/wav' }
const png = { name: 'cover.png', type: 'image/png' }
/** A preset of our own: the browser has no type for an unknown extension. */
const preset = { name: 'bright.tremolo', type: '' }

test('everything is accepted without a rule', () => {
  expect(matchesAccept(wav)).toBe(true)
  expect(matchesAccept(wav, '')).toBe(true)
  expect(matchesAccept(wav, '  ,  ')).toBe(true)
})

test('an exact MIME type', () => {
  expect(matchesAccept(wav, 'audio/wav')).toBe(true)
  expect(matchesAccept(png, 'audio/wav')).toBe(false)
})

test('a type group takes every subtype', () => {
  expect(matchesAccept(wav, 'audio/*')).toBe(true)
  expect(matchesAccept(png, 'audio/*')).toBe(false)
})

test('an extension, for a file the browser has no type for', () => {
  expect(matchesAccept(preset, '.tremolo')).toBe(true)
  expect(matchesAccept(preset, '.wav')).toBe(false)
  expect(matchesAccept(preset, 'audio/*')).toBe(false)
})

test('any one entry of the list is enough', () => {
  expect(matchesAccept(png, 'audio/*,image/png')).toBe(true)
  expect(matchesAccept(preset, 'audio/*, .tremolo')).toBe(true)
  expect(matchesAccept(png, 'audio/*, .tremolo')).toBe(false)
})

test('case and surrounding space do not matter', () => {
  expect(
    matchesAccept({ name: 'LOOP.WAV', type: 'AUDIO/WAV' }, ' Audio/* '),
  ).toBe(true)
  expect(matchesAccept({ name: 'LOOP.WAV', type: '' }, '.wav')).toBe(true)
})

test('an extension rule says nothing about a file whose name is withheld', () => {
  // What a dragover reports: a type, but no name until the drop.
  expect(matchesAccept({ type: 'audio/wav' }, '.wav')).toBe(true)
  expect(matchesAccept({ type: 'image/png' }, '.wav')).toBe(true)
  // A rule that can be decided still decides.
  expect(matchesAccept({ type: 'image/png' }, 'audio/*')).toBe(false)
  expect(matchesAccept({ type: 'image/png' }, 'audio/*, .wav')).toBe(true)
})
