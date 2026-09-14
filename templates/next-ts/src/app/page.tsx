import { Components } from './Components'

import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>
        Next.js +{' '}
        <a
          href="https://tremolo-ui.mimoz.dev/"
          target="_blank"
          rel="noreferrer"
        >
          tremolo-ui
        </a>
      </h1>
      <p>
        Edit <code>src/app/Components.tsx</code> and save to see the change.
      </p>
      <div className={styles.components}>
        <Components />
      </div>
    </main>
  )
}
