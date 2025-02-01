/* eslint-disable @typescript-eslint/no-require-imports */
import { themes as prismThemes } from 'prism-react-renderer'

import type * as Preset from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'
import remarkNpm2Yarn from '@docusaurus/remark-plugin-npm2yarn'

import twemoji from '@twemoji/api'

import rehypeTwemoj from './src/rehype/twemoji';

const emojiBaseUrl = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets'

function emojiUrl(emoji: string, format: 'svg' | 'png' = 'svg') {
  const codePoint = twemoji.convert.toCodePoint(emoji)
  const fmt = format == 'svg' ? format : '72x72'
  return emojiBaseUrl + `/${fmt}/${codePoint.split('-')[0]}.${format}`
}

function typedocPlugins() {
  if (process.env.SKIP_API) {
    console.warn('skip typedoc generate')
    return []
  }
  return [
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'functions',
        entryPoints: [
          '../packages/functions/src/index.ts',
          '../packages/functions/src/components/Slider/type.ts',
          '../packages/functions/src/components/NumberInput/type.ts',
        ],
        tsconfig: '../packages/functions/tsconfig.json',
        out: './docs/api/functions',
        readme: 'none',
        // sourceLinkTemplate: 'https://github.com/m1m0zzz/tremolo-ui/blob/{gitRevision}/{path}#L{line}',
        // gitRemote: 'https://github.com/m1m0zzz/tremolo-ui.git',
        // gitRevision: 'xxxx',
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
      },
    ],
    // [
    //   'docusaurus-plugin-typedoc',
    //   {
    //     id: 'web-components',
    //     entryPoints: ['../packages/web-components/src/index.ts'],
    //     tsconfig: '../packages/web-components/tsconfig.json',
    //     out: './docs/api/web-components',
    //   },
    // ],
  ]
}

const config: Config = {
  title: '@tremolo-ui',
  tagline: 'UI library for Web Audio App',
  favicon: emojiUrl('🎸', 'svg'),
  // favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://tremolo-ui.vercel.app/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  // organizationName: 'm1m0zzz', // Usually your GitHub org/user name.
  // projectName: 'tremolo-ui', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

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
      githubLink: 'https://github.com/m1m0zzz/tremolo-ui/blob/main/site'
    }
  },

  plugins: [
    ...typedocPlugins()
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/m1m0zzz/tremolo-ui/tree/main/site/',
          remarkPlugins: [
            [remarkNpm2Yarn, { sync: true }],
          ],
          rehypePlugins: [rehypeTwemoj]
        },
        blog: false,
        theme: {
          customCss: ['./src/css/custom.css', '../packages/react/src/styles/index.css'],
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
    navbar: {
      title: '@tremolo-ui',
      logo: {
        alt: 'My Site Logo',
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
        {
          label: 'Templates',
          to: '/templates/',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          label: 'Storybook',
          position: 'right',
          items: [
            {
              href: 'https://tremolo-ui-sb-react.vercel.app/',
              label: 'React',
            },
            {
              href: 'https://tremolo-ui-sb-web-components.vercel.app/',
              label: 'Web Components',
            },
          ]
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
          title: 'UI Catalog',
          items: [
            {
              label: 'React',
              href: 'https://tremolo-ui-sb-react.vercel.app/',
            },
            {
              label: 'Web Components',
              href: 'https://tremolo-ui-sb-web-components.vercel.app/',
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
