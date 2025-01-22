import React, {useCallback, useState, type ReactNode} from 'react';
import clsx from 'clsx';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {LiveProvider, LiveEditor, LiveError, LivePreview} from 'react-live';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {
  ErrorBoundaryErrorMessageFallback,
  usePrismTheme,
} from '@docusaurus/theme-common';
import ErrorBoundary from '@docusaurus/ErrorBoundary';

import type {Props} from '@theme/Playground';
import type {ThemeConfig} from '@docusaurus/theme-live-codeblock';

import { RiCodeSSlashLine, RiCodeSLine, RiFileCopyLine, RiCheckLine, RiCodepenLine } from 'react-icons/ri';
import { FiCodesandbox, FiGithub } from 'react-icons/fi';
import { SiStackblitz } from 'react-icons/si';
import { parse } from './parser';
import { generateCodeSandboxUrl } from './external/codesandbox';
import { CodePenForm } from './external/codepen';
import { openStackblitz } from './external/stackblitz';

import styles from './styles.module.css';


function CopyButton({ copyCode }: { copyCode?: () => void }) {
  const [clicked, setClicked] = useState(false)

  return (
    <button
      className={clsx(styles.iconButton, clicked && styles.iconCopyClicked)}
      onClick={() => {
        if (clicked) return
        copyCode?.()
        setClicked(true)
        setTimeout(() => {
          setClicked(false)
        }, 1000)
      }}
      title={clicked ? 'Copied!' : 'Copy'}
    >
      {clicked ? <RiCheckLine /> : <RiFileCopyLine />}
    </button>
  )
}

interface ControlsProps {
  code: string
  githubPath?: string
  showCode?: boolean
  setShowCode?: (arg: boolean | (() => boolean)) => void
  expanded?: boolean
  setExpanded?: (arg: boolean | (() => boolean)) => void
  setCodesandbox?: (arg: boolean | (() => boolean)) => void
  copyCode?: () => void
}

function Controls({
  code,
  githubPath,
  showCode,
  setShowCode,
  expanded,
  setExpanded,
  copyCode,
}: ControlsProps) {
  return (
    <div className={clsx(styles.playgroundHeader)}>
      <div
        className={styles.iconButtons}
      >
        {
          showCode &&
          <button
            className={clsx(styles.iconButton, styles.expandButton)}
            onClick={() => setExpanded?.(() => !expanded)}
          >
            {expanded ? `Collapse code` : `Expand code`}
          </button>
        }
        <button
          className={styles.iconButton}
          title='Open in Stackblitz'
          onClick={() => openStackblitz(code)}
        >
          <SiStackblitz />
        </button>
        <a
          className={styles.iconButton}
          title='Open in CodeSandbox'
          href={generateCodeSandboxUrl(code)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FiCodesandbox />
        </a>
        <CodePenForm code={code}>
          <button
            type="submit"
            className={styles.iconButton}
            title='Open in CodePen'
          >
            <RiCodepenLine />
          </button>
        </CodePenForm>
        <a
          className={styles.iconButton}
          title='Open in GitHub'
          href={githubPath}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FiGithub />
        </a>
        <CopyButton copyCode={copyCode} />
        <button
          className={styles.iconButton}
          onClick={() => setShowCode?.(() => !showCode)}
          title={showCode ? 'Hide code' : 'Show code'}
        >
          {showCode ? <RiCodeSSlashLine /> : <RiCodeSLine />}
        </button>
      </div>
    </div>
  )
}

function LivePreviewLoader() {
  // Is it worth improving/translating?
  // eslint-disable-next-line @docusaurus/no-untranslated-text
  return <div>Loading...</div>;
}

function Preview() {
  // No SSR for the live preview
  // See https://github.com/facebook/docusaurus/issues/5747
  return (
    <BrowserOnly fallback={<LivePreviewLoader />}>
      {() => (
        <>
          <ErrorBoundary
            fallback={(params) => (
              <ErrorBoundaryErrorMessageFallback {...params} />
            )}>
            <LivePreview />
          </ErrorBoundary>
          <LiveError />
        </>
      )}
    </BrowserOnly>
  );
}

function Result() {
  return (
    <div className={styles.playgroundPreview}>
      <Preview />
    </div>
  );
}


function ThemedLiveEditor({ code }: { code?: string }) {
  const isBrowser = useIsBrowser();
  return (
    <LiveEditor
      // We force remount the editor on hydration,
      // otherwise dark prism theme is not applied
      key={String(isBrowser)}
      className={styles.playgroundEditor}
      code={code}
    />
  );
}

// this should rather be a stable function
// see https://github.com/facebook/docusaurus/issues/9630#issuecomment-1855682643
const DEFAULT_TRANSFORM_CODE = (code: string) => `${code};`;

type customLiveCodeBlock = {
  liveCodeBlock?: {
    defaultShowCode?: boolean
    defaultExpanded?: boolean
    /**
     * @example https://github.com/m1m0zzz/tremolo-ui/blob/main/site
     */
    githubLink?: string
  }
}

interface ExtendProps {
  sourcePath?: string
}

export default function Playground({
  children,
  transformCode,
  sourcePath = '',
  ...props
}: Props & ExtendProps): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const customFields = siteConfig?.customFields as customLiveCodeBlock
  const defaultShowCode = customFields?.liveCodeBlock?.defaultShowCode
  const defaultExpanded = customFields?.liveCodeBlock?.defaultExpanded
  const githubLink = customFields?.liveCodeBlock?.githubLink
  const githubPath = (githubLink?.replace(/\/$/, '') || '') + '/' + sourcePath

  const prismTheme = usePrismTheme()
  const [showCode, setShowCode] = useState(defaultShowCode || false)
  const [expanded, setExpanded] = useState(defaultExpanded || false)

  const noInline = props.metastring?.includes('noInline') ?? false

  const { expand, collapse } = parse(children?.replace(/\n$/, ''))

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(expanded ? expand : collapse)
  }, [expanded])

  return (
    <div className={styles.playgroundContainer}>
      <LiveProvider
        code={collapse}
        disabled={expanded}
        noInline={noInline}
        transformCode={transformCode ?? DEFAULT_TRANSFORM_CODE}
        theme={prismTheme}
        {...props}
      >
        <Result />
        <Controls
          code={expand}
          showCode={showCode}
          setShowCode={setShowCode}
          expanded={expanded}
          setExpanded={setExpanded}
          copyCode={() => copyCode()}
          githubPath={githubPath}
        />
        {showCode && <ThemedLiveEditor code={expanded ? expand : collapse} />}
      </LiveProvider>
    </div>
  );
}
