import type { ReactNode } from 'react'

import styles from './Card.module.css'

interface CardProps {
  title: string
  children?: ReactNode
}

export function Card({ title, children }: CardProps) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </section>
  )
}
