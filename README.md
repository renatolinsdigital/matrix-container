# MatrixContainer

A React component that renders animated katakana matrix-rain behind your content.

![print](print/print.png)

## Install & Run

```bash
npm install
npm run dev
# → localhost:5173
```

## Usage

```tsx
import MatrixContainer from '@/component/MatrixContainer';

<MatrixContainer
  as="section"
  canvasOpacity={0.3}
  config={{ columnDensity: 0.4, tickMs: 80, fontSize: 20 }}
>
  <h1>Your content here</h1>
</MatrixContainer>
```

`config` is merged over the defaults at mount and then applied **live** — changing it on a later render (e.g. from a slider, as in the bundled demo) updates the running animation in place, with no remount and no restart. See [docs/component.md](docs/component.md) for how that works.

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | ReactNode | — | Content over the animation |
| `config` | Partial<MatrixConfig> | — | Animation overrides (see below) |
| `canvasOpacity` | number | 1 | Canvas opacity (0–1) |
| `as` | ElementType | 'div' | HTML element type |
| `className` | string | — | CSS class for wrapper |
| `style` | CSSProperties | — | Inline styles |
| `id` | string | — | HTML id |
| `ref` | Ref | — | Forwarded to wrapper |

## Config

Defaults, from [`src/lib/matrixConfig.ts`](src/lib/matrixConfig.ts):

```typescript
{
  fontSize: 20,            // character size in px (also sets the animation's column/row grid)
  columnDensity: 0.5,      // 0–1, probability a given column is active
  trailLength: 10,         // glyph count in the fading trail
  tickMs: 50,              // delay between animation ticks — lower is faster
  color: '0, 255, 0',      // RGB triplet, no alpha
  headOpacity: 1,          // leading glyph opacity
  trailOpacityMax: 0.8,    // opacity of the trail's brightest (non-head) glyph
  chars: [...]             // glyph pool (default: full-width katakana + digits)
}
```

`config` only needs to specify the fields you want to override — everything else falls back to the defaults above.

## Presets

**Subtle** — sparse, slow, minimal trail
```ts
{ columnDensity: 0.15, tickMs: 250, trailLength: 6, headOpacity: 0.35 }
```

**Default** — full density, fast
```ts
{ columnDensity: 1, tickMs: 60, trailLength: 10, headOpacity: 0.20 }
```

**Dramatic** — classic Matrix look
```ts
{ columnDensity: 0.45, tickMs: 100, trailLength: 16, headOpacity: 0.90 }
```

## How it Works

- The canvas is treated as a character grid (`fontSize` = cell size); each column tracks the row of its falling "head" glyph in a `drops` array.
- A `requestAnimationFrame` loop redraws every tick, throttled by `tickMs`; `ResizeObserver` re-measures and reseeds the grid on any layout change.
- Content passed as `children` renders in a separate layer above the canvas via `position: relative; z-index: 1` — no manual z-index juggling needed.
- Characters re-randomize every frame (not just when a new one enters) for the flicker effect.
- `config` changes are applied to the running animation in place rather than restarting it — a density/font-size change forces an immediate re-seed of the grid so it's visible right away instead of trickling in.
- Cleanup on unmount cancels the animation frame and disconnects the `ResizeObserver` — no leaks.

Full breakdown of the algorithm and the config-mutation strategy: **[docs/component.md](docs/component.md)**.

## Browser Support

Chrome, Edge, Firefox, Safari (recent versions). Requires Canvas 2D + ResizeObserver.

## License

MIT
