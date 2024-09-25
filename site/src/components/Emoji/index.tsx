import twemoji from 'twemoji'

import styles from './styles.module.css'

export function emojiUrl(emoji: string, format: 'svg' | 'png' = 'svg') {
  const codePoint = twemoji.convert.toCodePoint(emoji)
  const fmt = format == 'svg' ? format : '72x72'
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/${fmt}/${codePoint.split('-')[0]}.${format}`
}

interface Props {
  emoji: string
  format?: 'svg' | 'png'
}

export function Emoji({ emoji, format = 'svg' }: Props) {
  return (
    <img
      className={styles.emoji}
      src={emojiUrl(emoji, format)}
      alt={emoji}
      draggable={false}
    />
  )
}
