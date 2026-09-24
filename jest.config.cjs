/**
 * Isolated Jest config for the MapApp client.
 *
 * - Uses its own tsconfig (`tests/tsconfig.json`) so nothing in the main
 *   Vite/TS build is affected.
 * - Node test environment — these are pure/simple unit tests, no DOM.
 * - Only picks up files under `tests/`.
 */
/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  roots: ['<rootDir>/tests'],
  testEnvironment: 'node',
  testRegex: '\\.test\\.tsx?$',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tests/tsconfig.json' },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    // Resolve the linked package to its TypeScript source so ts-jest can
    // compile it (the published dist is ESM-only, which CJS jest can't load).
    '^@mapapp/map$': '<rootDir>/../mapapp-packages/map/src/index.ts',
    // Force shared libs to the host's copies (the linked package's own
    // node_modules lacks peer deps like @emotion/*).
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^react-dom/(.*)$': '<rootDir>/node_modules/react-dom/$1',
    '^mobx$': '<rootDir>/node_modules/mobx',
    '^mobx-react-lite$': '<rootDir>/node_modules/mobx-react-lite',
    '^@mui/material$': '<rootDir>/node_modules/@mui/material',
    '^@mui/material/(.*)$': '<rootDir>/node_modules/@mui/material/$1',
    '^@mui/icons-material/(.*)$': '<rootDir>/node_modules/@mui/icons-material/$1',
    '\\.(png|jpe?g|gif|webp|avif|svg|css)$': '<rootDir>/tests/__mocks__/assetStub.cjs',
  },
  clearMocks: true,
};
