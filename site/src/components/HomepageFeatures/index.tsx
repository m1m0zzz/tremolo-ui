/* eslint-disable @typescript-eslint/no-require-imports */
import Translate from '@docusaurus/Translate'
import Heading from '@theme/Heading'
import clsx from 'clsx'

import styles from './styles.module.css'

type FeatureItem = {
  id: string
  title: string
  Svg: React.ComponentType<React.ComponentProps<'svg'>>
  description: string
}

const FeatureList: FeatureItem[] = [
  {
    id: 'easy-to-use',
    title: 'Easy to Use',
    Svg: require('@site/static/img/undraw_compose_music.svg').default,
    description: 'tremolo-ui is designed to be easy to use and customize.',
  },
  {
    id: 'mobile-support',
    title: 'Mobile Support',
    Svg: require('@site/static/img/undraw_mobile_web.svg').default,
    description: 'tremolo-ui also supports mobile-specific actions.',
  },
  {
    id: 'headless-ui-like',
    title: 'Headless UI like',
    Svg: require('@site/static/img/undraw_web_development.svg').default,
    description:
      'It provides a rich default UI and a DOM-like component system that is easy to customize.',
  },
]

function Feature({ id, title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">
          <Translate id={`homepage.features.${id}.title`}>{title}</Translate>
        </Heading>
        <p>
          <Translate id={`homepage.features.${id}.description`}>
            {description}
          </Translate>
        </p>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
