# Two-effect config-mutation pattern (the core trick)

`MatrixContainer.tsx` uses one `useEffect` with an empty dependency array to own the entire canvas lifecycle (setup, `ResizeObserver`, the rAF tick loop, cleanup). This runs **once** per mount.

The animation's config is not a dependency. Instead it's stored in a `useRef` (`cfgRef`) that the tick loop closure reads from every frame. A **second** `useEffect`, keyed on the `config` prop, mutates that same ref object in place via `Object.assign` on every subsequent render.

Because the tick closure and the mutator share the same object reference, changes take effect on the next animation frame with no remount, no effect teardown, and no visible flash. That's what makes the demo's live sliders possible.

Two config fields (`fontSize`, `columnDensity`) get special-cased in that second effect: they determine the column/row grid, or are only consulted when a column is seeded/rejoins, so a plain mutation could take a long time to become visible (or leave `drops` indexed against a stale column count). Both force an immediate re-seed of the `drops` array via `regridRef.current(true)`.

Everything else (`chars`, `color`, `headOpacity`, `trailOpacityMax`, `trailLength`, `tickMs`) is read fresh every frame and needs no special handling.

**If you touch the animation effect or the config-update effect, preserve this split.** Collapsing them (e.g. adding `config` to the main effect's deps) reintroduces the remount-on-every-change flash this design exists to avoid.

Full writeup: [docs/component.md](../../docs/component.md).
