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
      '**/storybook-static',
      '**/.docusaurus',
      '**/*.cache',
      '**/*.config.*',
      'site/docs/api',
      'site/examples',
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
      // Loose equality hides intent: `x == null` meaning "null or undefined"
      // reads the same as `key == 'Enter'`, where both sides are strings and
      // nothing is being coerced. Say which one is meant.
      eqeqeq: ['error', 'always'],
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
      'import/no-named-as-default': 'off',
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
