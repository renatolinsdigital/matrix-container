# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`MatrixContainer` is a single React component (Canvas 2D + `requestAnimationFrame`) that renders animated katakana "digital rain" behind arbitrary children. The repo is both the component's source (`src/component/MatrixContainer/`) and a demo app (`src/App.tsx`) that showcases/exercises it live. There is no separate library build — `index.ts` at the repo root just re-exports the component (`export { default } from './src/component/MatrixContainer'`), and consumers presumably import straight from source or via `@/component/MatrixContainer` path alias.

## Commands

```bash
npm run dev       # start Vite dev server at localhost:5173 (serves the demo app)
npm run build     # tsc typecheck (noEmit) + vite build
npm run preview   # preview a production build
```

There is no lint script, no test runner, and no CI config in this repo. `npm run build`'s `tsc` step is the only automated correctness check — run it after changes to verify types.

## Architecture

### Two-effect config-mutation pattern (the core trick)

`MatrixContainer.tsx` uses one `useEffect` with an empty dependency array to own the entire canvas lifecycle (setup, `ResizeObserver`, the rAF tick loop, cleanup) — this runs **once** per mount. The animation's config is not a dependency; instead it's stored in a `useRef` (`cfgRef`) that the tick loop closure reads from every frame. A **second** `useEffect`, keyed on the `config` prop, mutates that same ref object in place via `Object.assign` on every subsequent render. Because the tick closure and the mutator share the same object reference, changes take effect on the next animation frame with no remount, no effect teardown, and no visible flash — which is what makes the demo's live sliders possible.

Two config fields (`fontSize`, `columnDensity`) get special-cased in that second effect: they determine the column/row grid or are only consulted when a column is seeded/rejoins, so a plain mutation could take a long time to become visible (or leave `drops` indexed against a stale column count). Both force an immediate re-seed of the `drops` array via `regridRef.current(true)`. Everything else (`chars`, `color`, `headOpacity`, `trailOpacityMax`, `trailLength`, `tickMs`) is read fresh every frame and needs no special handling.

If you touch the animation effect or the config-update effect, preserve this split — collapsing them (e.g. adding `config` to the main effect's deps) reintroduces the remount-on-every-change flash this design exists to avoid.

Full writeup: [docs/component.md](docs/component.md).

### DOM/stacking structure

```
<Tag>                      wrapper, position: relative
  <canvas>                 position: absolute; inset: 0; z-index: 0; pointer-events: none
  <div class="content">    position: relative; z-index: 1 — children render here
</Tag>
```

`Tag` defaults to `'div'` but is `React.ElementType`-typed so callers can pass `as="section"`/`"main"`/etc. for semantic HTML; the ref is forwarded to this outer element via `React.forwardRef`.

### Path alias

`@/*` → `src/*`, configured in both `tsconfig.json` and `vite.config.ts` — keep these in sync if it ever changes.

### Demo app (`src/App.tsx`)

Not just a smoke test — it's a live testbed proving the config prop updates the running animation without remounting. Notable patterns if extending it:
- `config` passed to `MatrixContainer` is `useMemo`'d over the panel's state (density/tickMs/fontSize/theme) — required, since the component's contract explicitly asks for a stable object identity to avoid redundant merges.
- The speed slider's displayed value is deliberately inverted from `tickMs` (`TICK_MS_FASTEST + TICK_MS_SLOWEST - tickMs`) so "drag right = faster" reads naturally to users, even though `tickMs` itself is a delay (smaller = faster). Don't "fix" this by flipping it back — see [docs/demo.md](docs/demo.md) for the reasoning.
- Theme selection sets both `config.color` (feeds the canvas) and a `--accent` CSS custom property on the wrapper (feeds every themed element on the page via `color-mix(in srgb, var(--accent) X%, transparent)`) — one state change re-themes the rain and the UI together.
- The usage snippet shown in the demo is hand-tokenized JSX spans (not a regex tokenizer) plus a parallel plain-text template literal built from the same state, used for the clipboard copy — the two can't drift apart because they share a source of truth.

Full writeup: [docs/demo.md](docs/demo.md).

### `@vitejs/plugin-react` version pin

Pinned to `^6.0.3` in `package.json` to match Vite 8's peer range — an older `4.x` plugin against Vite 8 produces a spurious `Invalid key: "jsx"` warning on every dev-server start. Don't downgrade it without checking that warning is still absent.

## Docs

- [README.md](README.md) — install/usage, full prop table, config defaults/presets.
- [docs/component.md](docs/component.md) — deep dive on the component's animation algorithm and the config-mutation strategy above.
- [docs/demo.md](docs/demo.md) — deep dive on how the demo page itself (styling, theming, data-driven feature cards, the inverted slider) is built.
