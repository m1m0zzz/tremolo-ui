import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import storybook from 'eslint-plugin-storybook'
import importPlugin from 'eslint-plugin-import'
import hooksPlugin from 'eslint-plugin-react-hooks'

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  jsxA11y.flatConfigs.recommended,
  ...storybook.configs['flat/recommended'],
  {
    ignores: [
      '**/build',
      '**/dist',
      '**/.docusaurus',
      '**/*.cache',
      '**/*.config.*',
      'site/docs/api',
      'site/src/theme',
    ],
  },
  {
    ignores: ['**/*.stories.tsx'],
    plugins: {
      'react-hooks': hooksPlugin,
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      // https://github.com/facebook/react/issues/31687
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'import/named': 'off',
      'import/no-unresolved': 'off',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@tremolo-ui/**',
              group: 'external',
              position: 'after',
            },
            {
              pattern: '{.,..}/**/*.+(css|sass|less|scss|pcss|styl)',
              group: 'type',
              position: 'after',
            },
          ],
          'newlines-between': 'always',
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
]
