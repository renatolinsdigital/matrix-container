# Commands

```bash
npm run dev       # start Vite dev server at localhost:5173 (serves the demo app)
npm run build     # tsc typecheck (noEmit) + vite build
npm run preview   # preview a production build
```

There is no lint script, no test runner, and no CI config in this repo. `npm run build`'s `tsc` step is the only automated correctness check. Run it after changes to verify types.
