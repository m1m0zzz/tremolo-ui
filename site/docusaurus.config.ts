import remarkNpm2Yarn from '@docusaurus/remark-plugin-npm2yarn'
import { themes as prismThemes } from 'prism-react-renderer'

import rehypeTwemoj, { resolveOptions, toUrl } from './src/rehype/twemoji'

import type * as Preset from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'

function emojiUrl(emoji: string, format: 'svg' | 'png' = 'svg') {
  // The same helper the emojis in the pages go through: taking only the first
  // code point would ask the CDN for a different emoji as soon as one is made
  // of a ZWJ sequence.
  return toUrl(
    emoji,
    resolveOptions({ size: format === 'svg' ? 'svg' : '72x72' }),
  )
}

function typedocPlugins() {
  if (process.env.SKIP_API) {
    console.warn('skip typedoc generate')
    return []
  }
  console.log('gitRevision: ', process.env.COMMIT_SHA)
  return [
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'functions',
        entryPoints: ['../packages/functions/src/index.ts'],
        tsconfig: '../packages/functions/tsconfig.json',
        out: './docs/api/functions',
        readme: 'none',
        router: 'kind',
        parametersFormat: 'table',
        enumMembersFormat: 'table',
        useCodeBlocks: true,
        // for Vercel Deploy (npm run build:docs:production)
        ...(process.env.COMMIT_SHA && {
          sourceLinkTemplate:
            'https://github.com/m1m0zzz/tremolo-ui/blob/{gitRevision}/{path}#L{line}',
          gitRevision: process.env.COMMIT_SHA,
        }),
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'dom',
        entryPoints: ['../packages/dom/src/index.ts'],
        tsconfig: '../packages/dom/tsconfig.json',
        out: './docs/api/dom',
        readme: 'none',
        router: 'kind',
        parametersFormat: 'table',
        enumMembersFormat: 'table',
        useCodeBlocks: true,
        // A module page and one of its symbols can have the same slug (for
        // example, `xy` and `XY`). Preserve TypeDoc's link targets instead of
        // relying on Docusaurus's deduplicated heading IDs.
        useCustomAnchors: true,
        // for Vercel Deploy (npm run build:docs:production)
        ...(process.env.COMMIT_SHA && {
          sourceLinkTemplate:
            'https://github.com/m1m0zzz/tremolo-ui/blob/{gitRevision}/{path}#L{line}',
          gitRevision: process.env.COMMIT_SHA,
        }),
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'react',
        entryPoints: ['../packages/react/src/index.ts'],
        tsconfig: '../packages/react/tsconfig.json',
        out: './docs/api/react',
        readme: 'none',
        router: 'kind',
        parametersFormat: 'table',
        enumMembersFormat: 'table',
        useCodeBlocks: true,
        // for Vercel Deploy (npm run build:docs:production)
        ...(process.env.COMMIT_SHA && {
          sourceLinkTemplate:
            'https://github.com/m1m0zzz/tremolo-ui/blob/{gitRevision}/{path}#L{line}',
          gitRevision: process.env.COMMIT_SHA,
        }),
      },
    ],
  ]
}

const config: Config = {
  title: '@tremolo-ui',
  tagline: 'UI library for Web Audio App',
  favicon: emojiUrl('🎸', 'svg'),
  // favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://tremolo-ui.mimoz.dev/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  // organizationName: 'm1m0zzz', // Usually your GitHub org/user name.
  // projectName: 'tremolo-ui', // Usually your repo name.

  trailingSlash: true,

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja'],
    localeConfigs: {
      en: {
        label: 'English',
      },
      ja: {
        label: '日本語',
      },
    },
  },

  customFields: {
    liveCodeBlock: {
      githubLink: 'https://github.com/m1m0zzz/tremolo-ui/blob/main/site',
    },
  },

  plugins: [...typedocPlugins()],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/m1m0zzz/tremolo-ui/tree/main/site/',
          remarkPlugins: [[remarkNpm2Yarn, { sync: true }]],
          rehypePlugins: [rehypeTwemoj],
        },
        blog: false,
        theme: {
          customCss: [
            './src/css/custom.css',
            // The demo theme. The package ships no CSS, so the examples on
            // this site are styled by the same files it publishes for copying.
            './src/css/tremolo/Knob.css',
            './src/css/tremolo/NumberInput.css',
            './src/css/tremolo/Piano.css',
            './src/css/tremolo/PointsEditor.css',
            './src/css/tremolo/Slider.css',
            './src/css/tremolo/XYPad.css',
          ],
        },
        sitemap: {
          lastmod: 'date',
          ignorePatterns: ['/tags/**'],
        },
        gtag: {
          trackingID: 'G-DL281M7CR5',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ['@docusaurus/theme-live-codeblock'],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    docs: {
      sidebar: {
        autoCollapseCategories: true,
      },
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    algolia: {
      appId: 'E2BGVJ3J9Z',
      apiKey: '63807df77d88cc40327c178e01fbbb45',
      indexName: 'tremolo-ui',
      contextualSearch: true,
    },
    navbar: {
      title: '@tremolo-ui',
      logo: {
        alt: 'tremolo-ui',
        src: emojiUrl('🎸', 'svg'),
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'typedocSidebar',
          position: 'left',
          label: 'API',
        },
        // {
        //   label: 'Templates',
        //   to: '/templates/',
        // },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://tremolo-ui.mimoz.dev/i/storybook-react/',
          label: 'Storybook',
          position: 'right',
        },
        {
          href: 'https://github.com/m1m0zzz/tremolo-ui',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        {
          href: 'https://www.npmjs.com/org/tremolo-ui',
          position: 'right',
          className: 'header-npm-link',
          'aria-label': 'npm',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'introduction',
              to: '/docs/',
            },
          ],
        },
        {
          title: 'API',
          items: [
            {
              label: 'functions',
              to: '/docs/api/functions',
            },
            {
              label: 'React',
              to: '/docs/api/react',
            },
          ],
        },
        {
          title: 'Other',
          items: [
            {
              label: 'Contributing',
              to: '/docs/guides/CONTRIBUTING/',
            },
            {
              label: 'Security',
              to: '/docs/guides/SECURITY/',
            },
            {
              label: 'Changelog',
              to: '/docs/changelog/',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/m1m0zzz/tremolo-ui',
            },
            {
              label: 'Storybook',
              href: 'https://tremolo-ui.mimoz.dev/i/storybook-react/',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/org/tremolo-ui',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} mimoz.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
