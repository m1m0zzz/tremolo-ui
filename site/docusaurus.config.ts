/* eslint-disable @typescript-eslint/no-require-imports */
import { themes as prismThemes } from 'prism-react-renderer'
import twemoji from 'twemoji'

import type * as Preset from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'

function emojiUrl(emoji: string, format: 'svg' | 'png' = 'svg') {
  const codePoint = twemoji.convert.toCodePoint(emoji)
  const fmt = format == 'svg' ? format : '72x72'
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/${fmt}/${codePoint.split('-')[0]}.${format}`
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

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'functions',
        entryPoints: ['../packages/functions/src/index.ts'],
        tsconfig: '../packages/functions/tsconfig.json',
        out: './docs/api/functions',
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'react',
        entryPoints: ['../packages/react/src/index.ts'],
        tsconfig: '../packages/react/tsconfig.json',
        out: './docs/api/react',
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
            [require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }],
          ],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    docs: {
      sidebar: {
        autoCollapseCategories: true,
      },
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
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/org/tremolo-ui',
          label: 'npm',
          position: 'right',
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
              label: 'Docs',
              to: '/docs/',
            },
          ],
        },
        {
          title: 'API',
          items: [
            {
              label: 'API',
              to: '/docs/api/functions',
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
