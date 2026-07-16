# `@vitejs/plugin-react` version pin

Pinned to `^6.0.3` in `package.json` to match Vite 8's peer range. An older `4.x` plugin against Vite 8 produces a spurious `Invalid key: "jsx"` warning on every dev-server start.

Don't downgrade it without checking that warning is still absent.
