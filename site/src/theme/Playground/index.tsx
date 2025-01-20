import React, {forwardRef, useImperativeHandle, useRef, useState, type ReactNode} from 'react';
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

import styles from './styles.module.css';
import { RiCodeSSlashLine, RiCodeSLine, RiFileCopyLine, RiCheckLine, RiCodepenLine } from 'react-icons/ri';
import { FiCodesandbox } from 'react-icons/fi';
import { generateCodeSandboxUrl } from './codeSandbox';
import { parse } from './parser';

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
  showCode?: boolean
  setShowCode?: (arg: boolean | (() => boolean)) => void
  expanded?: boolean
  setExpanded?: (arg: boolean | (() => boolean)) => void
  setCodesandbox?: (arg: boolean | (() => boolean)) => void
  copyCode?: () => void
}

function Controls({
  code,
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
        <a
          className={styles.iconButton}
          title='Open in CodeSandbox'
          href={generateCodeSandboxUrl(code)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FiCodesandbox />
        </a>
        <a
          className={styles.iconButton}
          title='Open in CodePen'
          href='#'
          target="_blank"
          rel="noopener noreferrer"
        >
          <RiCodepenLine />
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

type ExtendsThemeConfig = ThemeConfig & {
  liveCodeBlock: {
    defaultShowCode?: boolean
    defaultExpanded?: boolean
  }
}

export default function Playground({
  children,
  transformCode,
  ...props
}: Props): ReactNode {
  const {
    siteConfig: {themeConfig},
  } = useDocusaurusContext();
  const {
    liveCodeBlock: {
      playgroundPosition,
      defaultShowCode,
      defaultExpanded
    },
  } = themeConfig as ExtendsThemeConfig;
  const prismTheme = usePrismTheme();
  const [showCode, setShowCode] = useState(defaultShowCode ?? false);
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)

  const noInline = props.metastring?.includes('noInline') ?? false;

  const copyCode = () => {
    navigator.clipboard.writeText(children)
  }

  const { expand, collapse } = parse(children?.replace(/\n$/, ''))

  console.log({ expand, collapse })

  return (
    <div className={styles.playgroundContainer}>
      <LiveProvider
        code={collapse} // executed code
        disabled={expanded}
        noInline={noInline}
        transformCode={transformCode ?? DEFAULT_TRANSFORM_CODE}
        theme={prismTheme}
        {...props}
      >
        {playgroundPosition === 'top' ? (
          <>
            <Result />
            <Controls
              code={expand}
              showCode={showCode}
              setShowCode={setShowCode}
              expanded={expanded}
              setExpanded={setExpanded}
              copyCode={() => copyCode()}
            />
            {showCode && <ThemedLiveEditor code={expanded ? expand : collapse} />}
          </>
        ) : (
          <>
            {showCode && <ThemedLiveEditor code={expanded ? expand : collapse} />}
            <Controls
              code={expand}
              showCode={showCode}
              setShowCode={setShowCode}
              expanded={expanded}
              setExpanded={setExpanded}
              copyCode={() => copyCode()}
            />
            <Result />
          </>
        )}
      </LiveProvider>
    </div>
  );
}
