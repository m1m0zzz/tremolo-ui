import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import * as Tone from 'tone'

import { demoLoop } from './demo-loop'

import styles from './AudioSource.module.css'

/** Whichever source on the page is playing, so that starting one stops it. */
let current: { stop: () => void } | null = null

interface Props {
  /**
   * Build what the source plays into. Called on the first play, inside the
   * click: an audio context may only start from a user gesture.
   */
  connect: () => Tone.InputNode
}

/** Plays the demo loop, or a file of your own, round and round. */
export function AudioSource({ connect }: Props) {
  const playerRef = useRef<Tone.Player | null>(null)
  const [playing, setPlaying] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const getPlayer = () => {
    playerRef.current ??= new Tone.Player({
      loop: true,
      fadeIn: 0.01,
      fadeOut: 0.01,
    }).connect(connect())
    return playerRef.current
  }

  // The same object across renders, which is how this source recognises
  // itself in `current`.
  const self = useRef({
    stop: () => {
      playerRef.current?.stop()
      setPlaying(false)
    },
  })

  const stop = () => {
    self.current.stop()
    if (current === self.current) current = null
  }

  const play = async (buffer?: Tone.ToneAudioBuffer) => {
    await Tone.start()
    const player = getPlayer()
    if (buffer) player.buffer = buffer
    else if (!player.loaded) player.buffer = await demoLoop()
    if (current !== self.current) current?.stop()
    current = self.current
    player.stop().start()
    setPlaying(true)
  }

  const openFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Cleared, so that choosing the same file again still fires a change.
    event.target.value = ''
    if (!file) return
    const audio = await Tone.getContext().decodeAudioData(
      await file.arrayBuffer(),
    )
    await play(new Tone.ToneAudioBuffer(audio))
    setFileName(file.name)
  }

  useEffect(() => {
    const me = self.current
    return () => {
      if (current === me) current = null
      playerRef.current?.dispose()
      playerRef.current = null
    }
  }, [])

  return (
    <div className={styles.source}>
      <button
        type="button"
        className={styles.button}
        data-playing={playing ? '' : undefined}
        onClick={() => (playing ? stop() : void play())}
      >
        {playing ? '■ Stop' : '▶ Play'}
      </button>
      <label className={styles.button}>
        Open file
        <input type="file" accept="audio/*" onChange={openFile} hidden />
      </label>
      <span className={styles.name}>{fileName ?? 'Demo loop'}</span>
    </div>
  )
}
