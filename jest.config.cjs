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
    '\\.(png|jpe?g|gif|webp|avif|svg|css)$': '<rootDir>/tests/__mocks__/assetStub.cjs',
  },
  clearMocks: true,
};
