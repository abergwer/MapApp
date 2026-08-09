# React + TypeScript + Vite

## Project conventions

Three invariants keep this codebase simple — please don't break them:

1. **All shape mutations go through `EntityService`** (`src/Components/features/entities/EntityService.ts`).
   Never call `drawingToolStore.recordShape/updateShape/removeShape` directly from UI code — the
   service is the single writer that keeps undo/redo, server sync, id re-keying, and metadata
   merging correct in one place.

2. **Never read fast-ticking observables in container renders.** Anything driven by the view
   loop or live feeds (`mapEngineStore.viewState`, target stores) must be read inside a small
   leaf observer so only it re-renders per tick. Reference examples: `CoordinateChip`
   (MapWrapper), `LayersWrapper`, `VideoMuteButton`. Violating this froze map dragging once.

3. **Hosts extend the app by declaring defs, not by wiring components.** One injection pattern
   everywhere: `LayerGroupDef` (layers + visibility), `PanelDef` (workspace panels),
   `TopBarItem` (top bar), `LeftPanelView` (left tabs), `EntityDefinition` (entity types).
   Layer visibility has one rule: every panel row toggles exactly its own key, and a hidden
   group hides its whole subtree (see `buildLayers` / `shapeLayerKey` in
   `src/Components/layerManager/index.ts`).

## End-to-end tests

The Playwright suite starts Vite and the demo WebSocket server automatically.

```bash
npm run test:e2e
```

Open Playwright's interactive test UI:

```bash
npm run test:e2e:ui
```

Open the HTML report from the latest run:

```bash
npm run test:e2e:report
```

For a visible browser without the interactive UI, run `npm run test:e2e:headed`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
