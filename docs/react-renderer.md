# React Renderer

`@repo/renderer-react` provides React components for the shared Belt CSS contract. It uses Base UI for available behavior primitives and `@repo/theme-css` for all styling.

## Components

The React renderer mirrors the Remix renderer's visual hooks:

- `Panel`, `Button`, `GhostButton`, `StatusBanner`
- `Field`, `Label`, `Input`, `Slider`, `Switch`
- `Menu.Root`, `Menu.Trigger`, `Menu.List`, `Menu.Item`, `Submenu`
- `Select.Root`, `Select.Trigger`, `Select.List`, `Select.Option`
- `Combobox.Root`, `Combobox.Input`, `Combobox.Trigger`, `Combobox.List`, `Combobox.Option`
- `GlyphSheet`, `Glyph`

Base UI owns the React interaction and accessibility model for button, field/input, slider, switch, menu, select, and combobox. Belt owns only the markup classes and short `data-*` attributes that connect those components to `@repo/theme-css`.

`Panel` emits `data-radius` and defaults to `radius="outer"`. `StatusBanner.Root` also emits `data-radius` and defaults to `radius="default"`. Form controls, buttons, ghost buttons, and Base UI-backed triggers inherit the active child radius from CSS context rather than accepting renderer-specific radius props.

Menus use a compound component shape so consumers can choose the trigger element while Belt still supplies the shared popup and item classes:

```tsx
<Menu.Root>
  <Menu.Trigger render={<Button endIcon="chevronDown">Actions</Button>} />
  <Menu.List>
    <Menu.Item>Open worktree</Menu.Item>
  </Menu.List>
</Menu.Root>
```

Selects follow the same compound shape:

```tsx
<Select.Root value={destination}>
  <Select.Trigger defaultLabel="Destination" />
  <Select.List>
    <Select.Option value="workspace">Workspace</Select.Option>
  </Select.List>
</Select.Root>
```

Comboboxes also use compound parts:

```tsx
<Combobox.Root value={branch}>
  <Combobox.Trigger placeholder="Find branch" />
  <Combobox.List>
    <Combobox.Option value="main">main</Combobox.Option>
  </Combobox.List>
</Combobox.Root>
```

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
