// Ambient module declarations for non-code assets, so ts-jest can compile
// `import icon from '../assets/foo.png'` without a Vite/Webpack loader.
// The `moduleNameMapper` in jest.config.cjs handles the runtime side.
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.webp';
declare module '*.avif';
declare module '*.svg';
declare module '*.css';
