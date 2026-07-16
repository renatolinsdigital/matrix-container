# Demo app (`src/App.tsx`)

Not just a smoke test. It's a live testbed proving the config prop updates the running animation without remounting.

Notable patterns if extending it:

- `config` passed to `MatrixContainer` is `useMemo`'d over the panel's state (density/tickMs/fontSize/theme). This is required, since the component's contract explicitly asks for a stable object identity to avoid redundant merges.
- The speed slider's displayed value is deliberately inverted from `tickMs` (`TICK_MS_FASTEST + TICK_MS_SLOWEST - tickMs`) so "drag right = faster" reads naturally to users, even though `tickMs` itself is a delay (smaller = faster). Don't "fix" this by flipping it back. See [docs/demo.md](../../docs/demo.md) for the reasoning.
- Theme selection sets both `config.color` (feeds the canvas) and a `--accent` CSS custom property on the wrapper (feeds every themed element on the page via `color-mix(in srgb, var(--accent) X%, transparent)`). One state change re-themes the rain and the UI together.
- The usage snippet shown in the demo is hand-tokenized JSX spans (not a regex tokenizer) plus a parallel plain-text template literal built from the same state, used for the clipboard copy. The two can't drift apart because they share a source of truth.

Full writeup: [docs/demo.md](../../docs/demo.md).
