import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]', destructuredArrayIgnorePattern: '^[A-Z_]' }],
      // React Compiler v7 falsely flags setState inside async/.finally() as synchronous.
      // These patterns are valid React and intentional in this codebase.
      'react-hooks/set-state-in-effect': 'off',
      // React Compiler may skip optimization or flag ref usage in render for complex components.
      // These are intentional patterns in this codebase.
      'react-hooks/react-compiler': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
])
