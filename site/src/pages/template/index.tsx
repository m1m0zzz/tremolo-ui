import Heading from '@theme/Heading'
import Layout from '@theme/Layout'

import styles from './index.module.css'

export default function Template(): JSX.Element {
  return (
    <Layout>
      <main className={styles.main}>
        <Heading as="h1">Template</Heading>
        <p>TODO</p>
      </main>
    </Layout>
  )
}
