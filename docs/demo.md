# How the demo page was built

[src/App.tsx](../src/App.tsx) is the app that ships with this repo — it exists to showcase `MatrixContainer` (see [component.md](component.md)) and to be a live testbed for its config. This doc covers the choices in the demo itself, not the component.

## Structure

The page is `MatrixContainer` used as its own root (`as="main"`), with a nav bar, hero, terminal-styled control panel, a live code snippet, a feature grid, and a footer as its `children`:

```tsx
<MatrixContainer as="main" className={styles.app} config={config} style={{ '--accent': accent }}>
  <div className={styles.scanlines} />
  <div className={styles.container}>
    <nav>...brand + tech badges...</nav>
    <header>...pill + two-tone title...</header>
    <div className={styles.panel}>...terminal title bar, sliders + theme swatches...</div>
    <div className={styles.snippet}>...live-updating usage snippet + copy button...</div>
    <div className={styles.grid}>...feature cards with icons...</div>
    <footer>...license + tech line...</footer>
  </div>
</MatrixContainer>
```

The demo does *not* pass `canvasOpacity` (see component.md's prop table) — that's a second, independent opacity multiplier on the `<canvas>` element's CSS, separate from `MatrixConfig`'s per-glyph `headOpacity`/`trailOpacityMax`. An earlier version hardcoded `canvasOpacity={0.25}` to keep the rain as a backdrop rather than the main event, but once the panel's Opacity slider (below) existed, that silently capped the slider's visible ceiling to 25% — dragging it to `1` still wasn't "fully opaque" on screen, only fully opaque *within* that 25% cap. Since the config's own `headOpacity`/`trailOpacityMax` already do the same dimming job and are the only thing the slider controls, `canvasOpacity` was removed and the slider's default was lowered to `0.25` instead, to keep the same restrained look out of the box while leaving `1` as genuinely full opacity, no separate cap involved.

`.scanlines` is a fixed, pointer-events-none overlay rendered as a *sibling* of `.container` (both are children of `MatrixContainer`'s internal content layer), not a descendant of it. That matters because `.container` animates `transform` on mount (`fade-in`, below) — a `position: fixed` element inside an ancestor with an active `transform` would be repositioned relative to that ancestor instead of the viewport for the animation's duration. Keeping `.scanlines` a sibling sidesteps that entirely.

`.app::before` draws a faint fixed grid (`background-image` of two `linear-gradient`s, radial `mask-image` to fade it out toward the edges) behind the canvas — same stacking trick as before: a pseudo-element is painted as the first thing inside its box, so it sits behind the real `<canvas>` child at the same `z-index`.

### Data-driven feature cards

The four "why use this" cards are a `const FEATURES = [...] as const` array rendered with `.map()`, rather than four hand-written copies of the same JSX block. Each entry also carries an `icon` component (a small hand-written inline SVG, `stroke="currentColor"` so it inherits the card's color and reacts to `--accent` on hover) so the grid doesn't depend on an icon library:

```tsx
const FEATURES = [
  { id: '01', title: 'Configurable', body: 'Density, speed, colors, characters', icon: ConfigIcon },
  ...
] as const;

{FEATURES.map((feature) => {
  const Icon = feature.icon;
  return (
    <div className={styles.feature} key={feature.id}>
      <div className={styles.featureTop}>
        <span className={styles.featureIcon}><Icon /></span>
        <div className={styles.label}>{feature.id}</div>
      </div>
      <h3>{feature.title}</h3>
      <p>{feature.body}</p>
    </div>
  );
})}
```
Adding, removing, or reordering a card is a one-line data change, and there's no risk of the four copies drifting out of sync with each other's markup.

### The nav bar and tech badges

A thin `<nav>` sits above the hero: a brand mark (a blinking block-cursor `span`, `@keyframes blink`, evoking a terminal prompt) on the left, and a static row of pill badges (`React 18` / `TypeScript` / `Canvas 2D` / `Zero-dep`) on the right — a `const BADGES = [...] as const` mapped the same way as `FEATURES`. The badges hide below 640px rather than wrapping awkwardly next to the brand.

### The terminal-styled panel

The control panel is framed like a code editor window: a `.panelBar` strip with three `.dots` (red/yellow/green, fixed colors — not `--accent`-driven, since they're meant to read as literal macOS traffic lights) and a fake filename (`matrix.config.ts`), then a `.panelBody`. This is purely a framing device — no behavior changed from the sliders' original implementation.

`.panelBody` stacks two independent rows rather than putting theme swatches and sliders in one shared grid: the `.panelGroup` (Theme, a multi-row button grid) on top, then `.panelSliders` (Density/Speed/Font size, always single-row fields) below. They used to share one `grid-template-columns` grid, which meant a slider cell's row height was set by the *taller* theme-swatch cell next to it — `align-items: end` bottom-aligned the short slider inside that borrowed height, leaving a visibly empty gap above it at the two-column breakpoint. Giving each its own row removes the height-sharing entirely, so `.panelSliders` can pick its own column count (3 → 2 → 1 at 720px/420px) independent of how many rows the swatches wrap to.

### The live usage snippet

Below the panel, `.snippet` renders a fake code editor block showing the exact `<MatrixContainer config={{...}}>` JSX a developer would write to reproduce the current panel state. It reads the same `density` / `tickMs` / `fontSize` / `theme` state as the panel — there's no separate source of truth, so it's always in sync without an effect or extra memo beyond the `configCode` string used for clipboard copy.

The highlighted markup is written as literal JSX spans (`.tokTag`, `.tokAttr`, `.tokKey`, `.tokStr`, `.tokNum`, `.tokPunct`) rather than run through a tokenizer/regex over a string — the snippet's shape is fixed, only the values change, so hand-placing spans around the dynamic parts is simpler and can't mis-tokenize. A parallel plain-text template literal (`configCode`, same state, same values) is what actually gets copied to the clipboard; the two are built from the same state so they can't drift apart.

The **Copy** button calls `navigator.clipboard.writeText(configCode)`, flips a `copied` flag for 1.5s (`Copy` → `Copied ✓`), and swallows any rejection silently — the Clipboard API can throw in insecure contexts or without a permissions grant, and there's no fallback UX worth building for that case in a demo. The 1.5s revert timer is tracked in a ref and cleared on unmount (and on rapid re-clicks) so it can't call `setState` after the component is gone.

## The control panel: exercising `config` live

The panel's whole point is to prove `MatrixContainer`'s `config` prop actually updates the running animation, not just to look interactive. Five pieces of state drive it:

```tsx
const [density, setDensity] = useState(0.35);
const [tickMs, setTickMs] = useState(100);
const [fontSize, setFontSize] = useState(18);
const [opacity, setOpacity] = useState(0.25);
const [theme, setTheme] = useState<ThemeKey>('emerald');

const config = useMemo(
  () => ({
    columnDensity: density,
    tickMs,
    fontSize,
    headOpacity: opacity,
    trailOpacityMax: opacity,
    color: THEMES[theme].rgb,
  }),
  [density, tickMs, fontSize, opacity, theme],
);
```

`config` is memoized so it only gets a new object identity when one of the five values actually changes — matching the component's own documented contract ("pass a stable object... so unrelated parent re-renders don't trigger redundant merges"). Because `MatrixContainer` applies config changes to the running animation in place (see component.md), no `key` prop or remount trick is needed here — the sliders just work.

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

### Opacity slider

Drives both `headOpacity` and `trailOpacityMax`, `min={0.1} max={1} step={0.05}` — not just `headOpacity` alone. The head glyph is only one of `trailLength` (10 by default) characters drawn per column each frame; the other nine are trail glyphs whose ceiling is `trailOpacityMax`. Binding the slider to `headOpacity` only was tried first and looked like a no-op — changing the single brightest glyph per column barely registers against nine trail glyphs still capped at the default 0.8. Setting both to the same value makes the whole rain (not just the head) respond, and means `1` really is fully opaque — no glyph capped below full alpha — rather than the trail staying at its 0.8 default regardless of the slider. Unlike `fontSize`/`columnDensity`, this needs no regrid: both fields are read fresh every frame, so dragging the slider dims/brightens the rain immediately.

### Theme swatches and the `--accent` variable

Eight themes, each named after a gemstone rather than a generic label (`Cyber`, `Alert`, etc.) — the earlier naming didn't scale once more than four or five colors were added, since there's no obvious generic name for, say, a pink or a gold. Gem names solve that: there's a well-known one for almost any hue.

```tsx
const THEMES = {
  emerald:    { rgb: '0, 255, 0',     hex: '#00ff00', label: 'Emerald' },
  turquoise:  { rgb: '0, 220, 255',   hex: '#00dcff', label: 'Turquoise' },
  sapphire:   { rgb: '0, 128, 255',   hex: '#0080ff', label: 'Sapphire' },
  amethyst:   { rgb: '178, 0, 255',   hex: '#b200ff', label: 'Amethyst' },
  ruby:       { rgb: '255, 40, 40',   hex: '#ff2828', label: 'Ruby' },
  roseQuartz: { rgb: '255, 79, 163',  hex: '#ff4fa3', label: 'Rose Quartz' },
  amber:      { rgb: '255, 176, 0',   hex: '#ffb000', label: 'Amber' },
  citrine:    { rgb: '255, 215, 0',   hex: '#ffd700', label: 'Citrine' },
} as const;
```

The eight hues are spread evenly around the color wheel (green, cyan, blue, violet, red, pink, orange, yellow) so no two swatches read as near-duplicates at a glance.

Each theme carries two representations of the same color: `rgb` (comma-separated, no alpha) for `MatrixConfig.color`, which the canvas renderer interpolates into an `rgba(...)` string, and `hex` for CSS. Selecting a theme sets both: `config.color` (the rain) and an inline custom property on `MatrixContainer` itself:

```tsx
<MatrixContainer style={{ '--accent': THEMES[theme].hex } as React.CSSProperties} ...>
```

Everything else — the title's accent half, the pill badge, the nav brand cursor, the panel/snippet borders, the feature card borders/headings, the slider thumbs, the swatch dots — reads `var(--accent)` (see [App.module.scss](../src/App.module.scss)) rather than hardcoding a color, usually through `color-mix(in srgb, var(--accent) X%, transparent)` for translucent variants. One state change re-themes the whole page and the rain together, with no per-element theme logic. A few things are deliberately *not* themed: the traffic-light dots on the panel/snippet title bars, and the syntax-highlighter's tag/attribute/string colors — those read as literal UI chrome and code-editor conventions, not as part of the rain's color identity, so they stay fixed regardless of theme (only `.tokNum`, which mirrors the slider values, ties into `--accent`).

## Styling notes

- **Font**: [JetBrains Mono](https://www.jetbrains.com/lp/mono/), loaded via a `<link>` in [index.html](../index.html) (weights 400/500/700). Chosen over the previous `'Courier New'` stack because it ships real bold/medium weights — Courier New doesn't, so browsers synthesize (“faux-bold”) it, which looks noticeably rougher on the large glowing title and the small uppercase panel labels. `'Courier New', 'Courier', monospace` is kept as a fallback stack.
- **Two-tone title**: `.titleGhost` ("Matrix") is an outline-only span (`color: transparent` + `-webkit-text-stroke`) and `.titleAccent` ("Container") is solid and glowing — a common dev-tool hero treatment that reads as more "designed" than a single flat color block, and gives the eye a resting point next to the glow.
- **Panel / snippet**: `backdrop-filter: blur(8px)` over a translucent black background — glass panels that let the rain show through faintly behind the controls without competing with them for legibility.
- **Custom range inputs**: `appearance: none` plus hand-styled `::-webkit-slider-thumb` / `::-moz-range-thumb` (a small glowing dot in `var(--accent)`) — the native slider styling doesn't fit the terminal aesthetic and doesn't support theming via CSS variables.
- **Theme swatch grid**: `.swatches` uses `display: grid; grid-template-columns: repeat(4, 1fr)` (capped at `max-width: 640px` so the row doesn't sprawl across a wide desktop panel — wide enough to keep the longer gem names like "Rose Quartz" comfortable), dropping to `repeat(2, 1fr)` at 560px — a fixed, explicit column count rather than `auto-fit`/`flex-wrap`. `auto-fit` was tried first, but its column count depends on how many `minmax(96px, 1fr)` tracks fit at a given width, which reflows unpredictably as the panel shrinks (e.g. 3 across with a single lone button on its own row) instead of breaking cleanly into even rows. Eight is divisible by both 4 and 2, so every breakpoint tier renders full rows with nothing left dangling.
- **Panel/slider layout**: see "The terminal-styled panel" above — `.panelSliders` is a separate grid from the theme swatches specifically so a short slider row never has to borrow its height from the taller swatch grid next to it. Four sliders, `repeat(4, 1fr)` down to `repeat(2, 1fr)` at 860px and `1fr` at 420px.
- **Blueprint grid backdrop**: `.app::before`, a faint two-`linear-gradient` grid (48px cells) masked to fade out radially toward the edges — a subtle "technical drawing" texture behind the rain, at low enough opacity (`color-mix(... 10%, transparent)`) that it never competes with the canvas or the foreground text.
- **Scanlines**: `.scanlines`, a fixed `repeating-linear-gradient` overlay at `opacity: 0.12` with `mix-blend-mode: overlay` — a CRT-style texture over the whole viewport, reinforcing the terminal/monitor feel without reducing text contrast enough to hurt legibility.
- **Entrance animation**: a single `@keyframes fade-in` (opacity + translateY) on `.container`, guarded by `@media (prefers-reduced-motion: reduce)` — which also disables the brand cursor blink and hero pill's pulse.
- **Responsive**: the control panel and feature grid both collapse via `grid-template-columns` media queries (4 → 2 → 1 columns), the nav badges hide below 640px rather than wrapping, and the page uses `min-height: 100vh` with normal document flow (not a fixed `height: 100vh` with `overflow: hidden`) so nothing can get clipped on short viewports — it scrolls instead.

## Build tooling notes

Two things outside `App.tsx` that exist specifically to support the demo cleanly:

- [src/vite-env.d.ts](../src/vite-env.d.ts) declares the `*.module.scss` module shape (`{ readonly [key: string]: string }`) — without it, TypeScript has no type for `import styles from './App.module.scss'`.
- `@vitejs/plugin-react` is pinned to `^6.0.3` in [package.json](../package.json), matching the peer range Vite 8 expects. An older `4.x` plugin version against Vite 8 produces a spurious `Invalid key: "jsx"` warning on every dev-server start.
