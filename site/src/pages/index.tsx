import Link from '@docusaurus/Link'
import Translate from '@docusaurus/Translate'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { Emoji } from '@site/src/components/Emoji'
import HomepageFeatures from '@site/src/components/HomepageFeatures'
import StorybookIcon from '@site/static/img/storybook-icon.svg'
import Heading from '@theme/Heading'
import Layout from '@theme/Layout'
import clsx from 'clsx'

import styles from './index.module.css'

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">
          <Translate id="homepage.tagline">{siteConfig.tagline}</Translate>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/"
            style={{
              maxWidth: 240,
              flex: '1 1 0px',
            }}
          >
            <Emoji emoji="💡" />
            <Translate id="homepage.getting-started">Getting Started</Translate>
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="https://tremolo-ui-sb-react.vercel.app/"
            style={{
              maxWidth: 240,
              flex: '1 1 0px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <StorybookIcon
              role="img"
              className={styles.icon}
              width={18}
              height={25}
            />
            React
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="https://tremolo-ui-sb-web-components.vercel.app/"
            style={{
              maxWidth: 240,
              flex: '1 1 0px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <StorybookIcon
              role="img"
              className={styles.icon}
              width={18}
              height={25}
            />
            Web Components
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function Home(): JSX.Element {
  return (
    <Layout
      title={`Home`}
      description="Components library for Audio Applications."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  )
}
