# How the demo page was built

[src/App.tsx](../src/App.tsx) is the app that ships with this repo — it exists to showcase `MatrixContainer` (see [component.md](component.md)) and to be a live testbed for its config. This doc covers the choices in the demo itself, not the component.

## Structure

The page is `MatrixContainer` used as its own root (`as="main"`), with a control panel and a feature grid as its `children`:

```tsx
<MatrixContainer as="main" className={styles.app} canvasOpacity={0.25} config={config} style={{ '--accent': accent }}>
  <div className={styles.container}>
    <header>...</header>
    <div className={styles.panel}>...sliders + theme swatches...</div>
    <div className={styles.grid}>...feature cards...</div>
  </div>
</MatrixContainer>
```

`canvasOpacity={0.25}` keeps the rain as a backdrop rather than the main event — full opacity fights with the foreground text for attention.

### Data-driven feature cards

The four "why use this" cards are a `const FEATURES = [...] as const` array rendered with `.map()`, rather than four hand-written copies of the same JSX block:

```tsx
const FEATURES = [
  { id: '01', title: 'Configurable', body: 'Density, speed, colors, characters' },
  ...
] as const;

{FEATURES.map((feature) => (
  <div className={styles.feature} key={feature.id}>
    <div className={styles.label}>{feature.id}</div>
    <h3>{feature.title}</h3>
    <p>{feature.body}</p>
  </div>
))}
```
Adding, removing, or reordering a card is a one-line data change, and there's no risk of the four copies drifting out of sync with each other's markup.

## The control panel: exercising `config` live

The panel's whole point is to prove `MatrixContainer`'s `config` prop actually updates the running animation, not just to look interactive. Four pieces of state drive it:

```tsx
const [density, setDensity] = useState(0.35);
const [tickMs, setTickMs] = useState(100);
const [fontSize, setFontSize] = useState(18);
const [theme, setTheme] = useState<ThemeKey>('green');

const config = useMemo(
  () => ({ columnDensity: density, tickMs, fontSize, color: THEMES[theme].rgb }),
  [density, tickMs, fontSize, theme],
);
```

`config` is memoized so it only gets a new object identity when one of the four values actually changes — matching the component's own documented contract ("pass a stable object... so unrelated parent re-renders don't trigger redundant merges"). Because `MatrixContainer` applies config changes to the running animation in place (see component.md), no `key` prop or remount trick is needed here — the sliders just work.

### Density slider

Binds directly to `columnDensity`, `min={0.05} max={1} step={0.05}`. Nothing inverted or transformed — higher value, denser rain.

### Speed slider — inverted on purpose

`tickMs` is a *delay*: smaller means the animation redraws more often, i.e. faster. But a slider where dragging right *increases* the number and *slows down* the animation reads as backwards to a user — "further right" conventionally means "more" of whatever the control represents. So the slider's own value is the inverse of `tickMs` within the same numeric range:

```tsx
const TICK_MS_FASTEST = 30;
const TICK_MS_SLOWEST = 200;

<input
  type="range"
  min={TICK_MS_FASTEST}
  max={TICK_MS_SLOWEST}
  value={TICK_MS_FASTEST + TICK_MS_SLOWEST - tickMs}
  onChange={(e) => setTickMs(TICK_MS_FASTEST + TICK_MS_SLOWEST - Number(e.target.value))}
/>
```

`TICK_MS_FASTEST + TICK_MS_SLOWEST - x` is just a reflection across the midpoint of `[30, 200]` — it maps the slider's own left/right position onto the opposite `tickMs` value, applied symmetrically to both the displayed `value` and the `onChange` handler so the round-trip is consistent. `tickMs` itself, and what the component does with it, is untouched — this is purely a UI-layer translation.

### Font size slider

Binds directly to `fontSize`, `min={12} max={32}`. Also drives the component's grid dimensions (see component.md's "regrid" section) — the demo doesn't need to know that; it just sets `config.fontSize` and the component handles re-seeding the grid.

### Theme swatches and the `--accent` variable

```tsx
const THEMES = {
  green: { rgb: '0, 255, 0', hex: '#00ff00', label: 'Classic' },
  cyan:  { rgb: '0, 220, 255', hex: '#00dcff', label: 'Cyber' },
  amber: { rgb: '255, 176, 0', hex: '#ffb000', label: 'Amber' },
  red:   { rgb: '255, 40, 40', hex: '#ff2828', label: 'Alert' },
} as const;
```

Each theme carries two representations of the same color: `rgb` (comma-separated, no alpha) for `MatrixConfig.color`, which the canvas renderer interpolates into an `rgba(...)` string, and `hex` for CSS. Selecting a theme sets both: `config.color` (the rain) and an inline custom property on `MatrixContainer` itself:

```tsx
<MatrixContainer style={{ '--accent': THEMES[theme].hex } as React.CSSProperties} ...>
```

Everything else — the glowing title, the divider gradient, the panel border, the feature card borders/headings, the slider thumbs, the swatch dots — reads `var(--accent)` (see [App.module.scss](../src/App.module.scss)) rather than hardcoding a color, usually through `color-mix(in srgb, var(--accent) X%, transparent)` for translucent variants. One state change re-themes the whole page and the rain together, with no per-element theme logic.

## Styling notes

- **Font**: [JetBrains Mono](https://www.jetbrains.com/lp/mono/), loaded via a `<link>` in [index.html](../index.html) (weights 400/500/700). Chosen over the previous `'Courier New'` stack because it ships real bold/medium weights — Courier New doesn't, so browsers synthesize (“faux-bold”) it, which looks noticeably rougher on the large glowing title and the small uppercase panel labels. `'Courier New', 'Courier', monospace` is kept as a fallback stack.
- **Panel**: `backdrop-filter: blur(8px)` over a translucent black background — a glass panel that lets the rain show through faintly behind the controls without competing with them for legibility.
- **Custom range inputs**: `appearance: none` plus hand-styled `::-webkit-slider-thumb` / `::-moz-range-thumb` (a small glowing dot in `var(--accent)`) — the native slider styling doesn't fit the terminal aesthetic and doesn't support theming via CSS variables.
- **Entrance animation**: a single `@keyframes fade-in` (opacity + translateY) on `.container`, guarded by `@media (prefers-reduced-motion: reduce)`.
- **Responsive**: the control panel and feature grid both collapse via `grid-template-columns` media queries (4 → 2 → 1 columns), and the page uses `min-height: 100vh` with normal document flow (not a fixed `height: 100vh` with `overflow: hidden`) so the panel + grid can never get clipped on short viewports — they scroll instead.

## Build tooling notes

Two things outside `App.tsx` that exist specifically to support the demo cleanly:

- [src/vite-env.d.ts](../src/vite-env.d.ts) declares the `*.module.scss` module shape (`{ readonly [key: string]: string }`) — without it, TypeScript has no type for `import styles from './App.module.scss'`.
- `@vitejs/plugin-react` is pinned to `^6.0.3` in [package.json](../package.json), matching the peer range Vite 8 expects. An older `4.x` plugin version against Vite 8 produces a spurious `Invalid key: "jsx"` warning on every dev-server start.
