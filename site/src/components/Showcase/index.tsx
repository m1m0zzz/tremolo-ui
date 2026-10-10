import BrowserOnly from '@docusaurus/BrowserOnly'
import Link from '@docusaurus/Link'
import Translate from '@docusaurus/Translate'
import CodeBlock from '@theme/CodeBlock'
import Heading from '@theme/Heading'
import clsx from 'clsx'
import { useId, useState, type ReactNode } from 'react'
import { FiGithub } from 'react-icons/fi'
import { RiCodeSSlashLine } from 'react-icons/ri'

import styles from './styles.module.css'

export interface ShowcaseFile {
  /** The name the tab shows, as the file is named in the demo's directory. */
  name: string
  code: string
}

interface Props {
  /** The anchor of the section, and the directory of the demo under `site/showcase/`. */
  id: string
  title: ReactNode
  description: ReactNode
  /** The components the demo is built from, each linked to its page. */
  components: string[]
  /** The demo's own files first, then whatever it shares with the others. */
  files: ShowcaseFile[]
  /** Span the whole row of the grid, for a demo wider than half of it. */
  wide?: boolean
  /** The demo itself, rendered in the browser only: it plays audio. */
  children: () => ReactNode
}

const LANGUAGES: Record<string, string> = {
  css: 'css',
  ts: 'ts',
  tsx: 'tsx',
}

const GITHUB = 'https://github.com/m1m0zzz/tremolo-ui/tree/main/site/showcase'

/** A demo on the stage, with its source behind a button. */
export function ShowcaseItem({
  id,
  title,
  description,
  components,
  files,
  wide = false,
  children,
}: Props) {
  const [showCode, setShowCode] = useState(false)
  const [active, setActive] = useState(0)
  const codeId = useId()
  const file = files[active]

  return (
    <section id={id} className={clsx(styles.item, wide && styles.wide)}>
      <div className={styles.stage}>
        <BrowserOnly fallback={<div className={styles.loading}>Loading…</div>}>
          {children}
        </BrowserOnly>
      </div>
      <div className={styles.meta}>
        <div className={styles.text}>
          <Heading as="h2" className={styles.title}>
            {title}
          </Heading>
          <p className={styles.description}>{description}</p>
          <ul className={styles.components}>
            {components.map((name) => (
              <li key={name}>
                <Link to={`/docs/components/${name}/`}>{name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={clsx(
              'button button--sm',
              showCode ? 'button--primary' : 'button--secondary',
            )}
            aria-expanded={showCode}
            aria-controls={codeId}
            onClick={() => setShowCode((show) => !show)}
          >
            <RiCodeSSlashLine aria-hidden />
            <Translate id="showcase.code">Code</Translate>
          </button>
          <a
            className={styles.github}
            href={`${GITHUB}/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            aria-label="GitHub"
          >
            <FiGithub />
          </a>
        </div>
      </div>
      <div id={codeId} className={styles.code} hidden={!showCode}>
        {showCode && (
          <>
            <ul className={clsx('tabs', styles.tabs)} role="tablist">
              {files.map(({ name }, index) => (
                <li
                  key={name}
                  role="tab"
                  tabIndex={index === active ? 0 : -1}
                  aria-selected={index === active}
                  className={clsx(
                    'tabs__item',
                    styles.tab,
                    index === active && 'tabs__item--active',
                  )}
                  onClick={() => setActive(index)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    setActive(index)
                  }}
                >
                  {name}
                </li>
              ))}
            </ul>
            <CodeBlock
              className={styles.codeBlock}
              language={LANGUAGES[file.name.split('.').pop() ?? ''] ?? 'text'}
              showLineNumbers
            >
              {file.code.trim()}
            </CodeBlock>
          </>
        )}
      </div>
    </section>
  )
}
