# React Renderer

`@repo/renderer-react` provides React components for the shared Belt CSS contract. It uses Base UI for available behavior primitives and `@repo/theme-css` for all styling.

## Components

The React renderer mirrors the Remix renderer's visual hooks:

- `Panel`, `Button`, `GhostButton`, `StatusBanner`
- `Field`, `Label`, `Input`, `Slider`, `Switch`
- `Menu`, `MenuItem`, `MenuList`, `Submenu`
- `Select`, `SelectOption`
- `Combobox`, `ComboboxOption`
- `GlyphSheet`, `Glyph`

Base UI owns the React interaction and accessibility model for button, field/input, slider, switch, menu, select, and combobox. Belt owns only the markup classes and short `data-*` attributes that connect those components to `@repo/theme-css`.

`Panel` emits `data-radius` and defaults to `radius="outer"`. `StatusBanner.Root` also emits `data-radius` and defaults to `radius="default"`. Form controls, buttons, ghost buttons, and Base UI-backed triggers inherit the active child radius from CSS context rather than accepting renderer-specific radius props.

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
