# Client unit tests

Simple, isolated Jest unit tests for the MapApp client.

These tests are intentionally kept **decoupled from the main build**:

- They live in this `tests/` folder with their own `tsconfig.json`.
- The main `tsconfig.app.json` / Vite build do **not** compile or reference them.
- `jest.config.cjs` at the repo root wires ts-jest → this folder only.
- No DOM, no map engine, no network — pure logic tests only.

## Run

```powershell
npm test
```

## Add a test

Create a new file `tests/<Something>.test.ts` and follow the existing pattern.
Keep tests small and dependency-free; heavier integration testing (React
components, MapLibre/Leaflet engines, WebRTC) is out of scope here.
