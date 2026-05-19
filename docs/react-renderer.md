# React Renderer

`@repo/renderer-react` currently provides the React side of the shared Belt glyph contract.

## Glyphs

The React glyph renderer uses the same names, symbol ids, and SVG definitions as the Remix renderer:

```tsx
import { Glyph, GlyphSheet } from "@repo/renderer-react";

export function AppShell() {
  return (
    <>
      <GlyphSheet />
      <button aria-label="Search">
        <Glyph name="search" />
      </button>
    </>
  );
}
```

`Glyph` defaults to `aria-hidden` when no label or labelled-by relationship is provided, matching Remix UI glyph behavior. Render `GlyphSheet` once before any glyph instances that reference it.
