# DOM/stacking structure

```
<Tag>                      wrapper, position: relative
  <canvas>                 position: absolute; inset: 0; z-index: 0; pointer-events: none
  <div class="content">    position: relative; z-index: 1 — children render here
</Tag>
```

`Tag` defaults to `'div'` but is `React.ElementType`-typed, so callers can pass `as="section"`/`"main"`/etc. for semantic HTML. The ref is forwarded to this outer element via `React.forwardRef`.
