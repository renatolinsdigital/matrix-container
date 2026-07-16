# How `MatrixContainer` was built

`MatrixContainer` ([src/component/MatrixContainer/MatrixContainer.tsx](../src/component/MatrixContainer/MatrixContainer.tsx)) is a single component: a `<canvas>` running a katakana "digital rain" animation, layered behind whatever children you pass it. This doc walks through why it's structured the way it is.

## Shape of the DOM

```tsx
<Tag ref={ref} className={classes} style={style} id={id}>
  <canvas ref={canvasRef} className={styles.canvas} style={...opacity} />
  <div className={styles.content}>{children}</div>
</Tag>
```

Three pieces, styled in [MatrixContainer.module.scss](../src/component/MatrixContainer/MatrixContainer.module.scss):

- `.wrapper` — `position: relative`, so the canvas has something to anchor to.
- `.canvas` — `position: absolute; inset: 0`, `z-index: 0`, `pointer-events: none`. It fills the wrapper and never intercepts clicks.
- `.content` — `position: relative; z-index: 1`. Ordinary stacking-context rules put it above the canvas without needing an explicit `z-index` on the canvas's siblings.

`Tag` defaults to `'div'` but is typed as `React.ElementType`, so callers can render a `<section>`, `<main>`, `<aside>` — whatever is semantically correct for where the component is used — without losing the effect. The component forwards its `ref` to that outer element via `React.forwardRef`, so a parent can measure it, focus it, or otherwise reach past the wrapper.

## The animation loop

Everything else lives inside one `useEffect` with an empty dependency array — it runs once per mount and owns the canvas for the component's whole lifetime.

**Setup**, run once:
```ts
const numCols = () => Math.floor(canvas.width / cfg.fontSize);
const numRows = () => Math.floor(canvas.height / cfg.fontSize);
```
The canvas is treated as a character grid. `fontSize` is the cell size in both directions (monospace assumption), so column/row counts fall straight out of the pixel dimensions.

**State**: a single `drops: number[]`, one entry per column, holding the row index of that column's *head* glyph. Negative values mean "still above the canvas" — that's what makes a column's rain appear to fall in from off-screen rather than popping into existence at row 0.

**Per frame** (`tick`, driven by `requestAnimationFrame`):
1. Self-reschedule immediately (`rafId = requestAnimationFrame(tick)`), then throttle: `if (t - last < cfg.tickMs) return;`. rAF still fires at display refresh rate (~60Hz), but the canvas is only cleared and redrawn once `tickMs` has elapsed — that's the actual "speed" knob.
2. `ctx.clearRect(...)` the whole canvas — this sim redraws every visible glyph every tick rather than only painting deltas; simpler code, and at these grid sizes (a few thousand glyphs, tens of times a second) still cheap for a 2D canvas.
3. For each column, walk its trail (`j = 0..trailLength`) and draw a glyph at `head - j`, brightest at the head (`headOpacity`) fading to `trailOpacityMax * (1 - j/trailLength)` at the tail. The character drawn is re-randomized *every* frame (`cfg.chars[Math.floor(Math.random() * cfg.chars.length)]`) independent of the previous frame's character at that cell — that flicker is what sells the "digital" look, as opposed to a single falling character per column.
4. `drops[i]++` — advance the column by one row.
5. Once the *tail* has fully cleared the bottom edge (`(head - trailLength) * fontSize > canvasHeight`), the column "rejoins": re-rolled against `columnDensity` to decide whether it becomes active again immediately or goes back to waiting off-screen, exactly like the initial seed below.

**Sizing**: a `ResizeObserver` on the canvas element calls `resize()` on any layout change, which re-reads `canvas.offsetWidth/Height`, assigns them to `canvas.width/height` (this both resizes the backing bitmap *and* implicitly clears it — canvas semantics, not a bug), and reseeds `drops` for the new column count. Cleanup on unmount disconnects the observer and cancels the pending animation frame — no leaks.

## Config: merge once, then mutate in place

`MatrixConfig` ([src/lib/matrixConfig.ts](../src/lib/matrixConfig.ts)) has 8 fields — `fontSize`, `columnDensity`, `trailLength`, `tickMs`, `color`, `headOpacity`, `trailOpacityMax`, `chars` — with defaults in `MATRIX_CONFIG`. The component takes a `Partial<MatrixConfig>` and layers it on top:

```ts
const cfgRef = useRef<MatrixConfig>({ ...MATRIX_CONFIG, ...config });
```

The animation effect captures `cfgRef.current` **once**, into a local `cfg` const, at setup time — and every read inside `tick()` goes through `cfg.<field>`, not through props or state. This is deliberate: putting `config` in the effect's dependency array would tear down and rebuild the whole canvas + observer + rAF loop on every change — a visible flash on every keystroke of a live control.

Instead, a **second effect** watches the `config` prop and updates the *same* object in place:

```ts
useEffect(() => {
  if (isMountRef.current) { isMountRef.current = false; return; } // skip mount; cfgRef already has these values
  if (!config) return;
  const needsRegrid = /* fontSize or columnDensity actually changed */;
  Object.assign(cfgRef.current, config);
  if (needsRegrid) regridRef.current?.(true);
}, [config]);
```

Because `cfg` (inside the animation closure) and `cfgRef.current` (mutated here) are *the same object reference*, `Object.assign` is enough to make `tickMs`, `color`, `headOpacity`, `trailOpacityMax`, `chars`, and `trailLength` update on literally the next animation frame — no restart, no flash, no dependency array. This is the trick that makes the demo's live sliders possible.

### Why `fontSize` and `columnDensity` need special handling

Two fields aren't "just read every frame":

- **`fontSize`** determines `numCols()`/`numRows()`, i.e. the grid itself. Changing it without resizing the grid would leave the `drops` array indexed against the old column count.
- **`columnDensity`** is only *consulted* when a column is seeded or rejoins after its tail clears the bottom. An already-inactive column can sit off-screen for many seconds before that happens — so mutating `columnDensity` alone can look like it did nothing for a long time.

Both are handled by calling `regridRef.current(true)` — a reference to the same `resize()` used by the `ResizeObserver`, but with an `immediate` flag:

```ts
const initDrops = (count: number, immediate = false) => {
  drops = Array.from({ length: count }, () => {
    const active = Math.random() < cfg.columnDensity;
    if (!active) return -(cfg.trailLength + Math.floor(Math.random() * numRows() * 2));
    return immediate ? Math.floor(Math.random() * numRows()) : -Math.floor(Math.random() * numRows());
  });
};
```

`immediate: false` (mount, real resize) seeds active columns *above* the canvas, so rain "arrives" gradually — the natural, cinematic entrance. `immediate: true` (a config-driven re-roll) scatters them across the *whole* visible height instead, so a density or font-size change reads on screen right away instead of trickling in over the next second or two. Same seeding logic, different starting distribution, chosen by who's calling it and why.

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `ReactNode` | — | Rendered in the `.content` layer, above the canvas |
| `config` | `Partial<MatrixConfig>` | — | Merged over `MATRIX_CONFIG` at mount; later changes are applied live (see above) |
| `canvasOpacity` | `number` | `1` | CSS `opacity` on the `<canvas>` element itself — multiplies with per-glyph opacity, cheap way to dim the whole effect |
| `as` | `ElementType` | `'div'` | Wrapper element tag, for semantic HTML |
| `className` | `string` | — | Merged onto the wrapper alongside the internal layout class |
| `style` | `CSSProperties` | — | Inline styles on the wrapper (useful for CSS custom properties, see the demo's theming) |
| `id` | `string` | — | Passed through to the wrapper |
| `ref` | `Ref<HTMLElement>` | — | Forwarded to the wrapper element |

## Known trade-offs

- The animation always redraws every visible glyph every tick — no dirty-rectangle tracking. Fine at typical `fontSize`/viewport combinations; a very small `fontSize` on a very large canvas means more glyphs per frame.
- A `columnDensity`/`fontSize` change triggers `canvas.width = canvas.offsetWidth` to re-measure, which clears the canvas bitmap as a side effect of the assignment (canvas spec behavior). The very next tick redraws it, so in practice this reads as an instant re-roll, not a blank flash — but it's worth knowing if you're chaining rapid programmatic config changes.
- `chars`, `color`, `headOpacity`, `trailOpacityMax`, and `trailLength` are read fresh every frame with no special-casing — they're "free" to update live and don't trigger a regrid.
