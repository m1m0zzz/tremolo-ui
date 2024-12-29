import { FaGithub, FaNpm } from 'react-icons/fa'

import styles from './index.module.css'

interface Props {
  href?: string
  target?: string
  title?: string
}

export function GitHubIcon({ target = '_blank', ...props }: Props) {
  return (
    <a className={styles.anchor} target={target} {...props}>
      <FaGithub size={24} />
    </a>
  )
}

export function NpmIcon({ target = '_blank', ...props }: Props) {
  return (
    <a className={styles.anchor} target={target} {...props}>
      <FaNpm size={24} />
    </a>
  )
}
