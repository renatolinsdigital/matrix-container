# What this is

`MatrixContainer` is a single React component (Canvas 2D + `requestAnimationFrame`) that renders animated katakana "digital rain" behind arbitrary children.

The repo is both the component's source (`src/component/MatrixContainer/`) and a demo app (`src/App.tsx`) that showcases/exercises it live.

There is no separate library build. `index.ts` at the repo root just re-exports the component (`export { default } from './src/component/MatrixContainer'`), and consumers presumably import straight from source or via the `@/component/MatrixContainer` path alias.
