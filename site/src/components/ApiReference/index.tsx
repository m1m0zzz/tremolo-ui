import Link from '@docusaurus/Link'
import Translate from '@docusaurus/Translate'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { Fragment } from 'react'

import generated from './props.generated.json'

import styles from './styles.module.css'

interface Prop {
  name: string
  required: boolean
  type: string
  default: string | null
  /** Rendered from Markdown by `scripts/api-props.mjs`. */
  description: { en: string; ja: string | null } | null
}

interface PropsType {
  /** Which directory typedoc wrote the page into. */
  kind: 'interfaces' | 'types'
  props: Prop[]
}

const propsTypes = generated as Record<string, PropsType>

/**
 * The props of one part, read from its type by `scripts/api-props.mjs`.
 *
 * `of` names the exported props type, e.g. `SliderTrackProps`. A name that is
 * not there fails the build, so a renamed type cannot leave an empty table.
 */
export function PropsTable({ of }: { of: string }) {
  const { i18n } = useDocusaurusContext()
  const propsType = propsTypes[of]
  if (!propsType) {
    throw new Error(
      `PropsTable: \`${of}\` is not a props type exported from @tremolo-ui/react`,
    )
  }
  const page = `/docs/api/react/${propsType.kind}/${of}`

  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>
              <Translate id="apiReference.props.prop">Prop</Translate>
            </th>
            <th>
              <Translate id="apiReference.props.type">Type</Translate>
            </th>
            <th>
              <Translate id="apiReference.props.default">Default</Translate>
            </th>
          </tr>
        </thead>
        <tbody>
          {propsType.props.map((prop) => {
            const description =
              prop.description &&
              (i18n.currentLocale === 'ja'
                ? (prop.description.ja ?? prop.description.en)
                : prop.description.en)
            return (
              <Fragment key={prop.name}>
                <tr className={description ? styles.hasDescription : undefined}>
                  <td className={styles.name}>
                    <code>{prop.name}</code>
                    {prop.required && (
                      <span className={styles.required}>
                        <Translate id="apiReference.props.required">
                          required
                        </Translate>
                      </span>
                    )}
                  </td>
                  <td>
                    <code className={styles.type}>{prop.type}</code>
                  </td>
                  <td>{prop.default ? <code>{prop.default}</code> : '—'}</td>
                </tr>
                {description && (
                  <tr className={styles.description}>
                    {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the text arrives through dangerouslySetInnerHTML, which the rule cannot see */}
                    <td colSpan={3}>
                      <div
                        // Our own JSDoc and translations, rendered at build time.
                        dangerouslySetInnerHTML={{ __html: description }}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
      <p className={styles.more}>
        <Translate
          id="apiReference.props.more"
          values={{ link: <Link to={page}>{of}</Link> }}
        >
          {'Full reference: {link}'}
        </Translate>
      </p>
    </>
  )
}
