import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

/** ESLint 9 flat config for Next 15 (eslint-config-next). */
const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'lib/build/manifest.json',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // The command registry and analytics take deliberately loose param records.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]

export default eslintConfig
