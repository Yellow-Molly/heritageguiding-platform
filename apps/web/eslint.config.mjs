import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'

// eslint-config-next already registers the jsx-a11y plugin, so we only add the
// recommended ruleset (not the full flat config) to avoid a "Cannot redefine plugin" error.
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', 'payload-types.ts', 'next-env.d.ts'],
  },
]

export default eslintConfig
