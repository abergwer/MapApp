import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Recognize MobX/React HOCs so wrapped default exports
      // (e.g. `export default observer(MyComponent)`) don't trip
      // react-refresh's component-only-export check.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, extraHOCs: ['observer', 'memo'] },
      ],
    },
  },
])
