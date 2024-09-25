import twemoji from 'twemoji'

import styles from './styles.module.css'

interface Props {
  emoji: string
  format: 'svg' | 'png'
}

export function Emoji({ emoji, format = 'svg' }: Props) {
  const codePoint = twemoji.convert.toCodePoint(emoji)
  const fmt = format == 'svg' ? format : '72x72'
  const url = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/${fmt}/${codePoint.split('-')[0]}.${format}`
  return (
    <img className={styles.emoji} src={url} alt={emoji} draggable={false} />
  )
}
