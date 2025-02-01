import { resolveOptions, toUrl } from '@site/src/rehype/twemoji'

import styles from './styles.module.css'

interface Props {
  emoji: string
  format?: 'svg' | '72x72'
}

export function Emoji({ emoji, format = 'svg' }: Props) {
  return (
    <img
      className={styles.emoji}
      src={toUrl(emoji, resolveOptions({size: format}))}
      alt={emoji}
      draggable={false}
    />
  )
}
