# React Renderer

`@repo/renderer-react` provides React components for the shared Belt CSS contract. It uses Base UI for available behavior primitives and `@repo/theme-css` for all styling.

The public React entrypoint is `@riff-refine/belt/react`. It re-exports the React renderer primitives, ready-made React Tool components, Control Panel config helpers, and the typed `createToolbar(...)` factory.

## Toolbar Provider

Initialize the React toolbar with `createToolbar(...)` from the same Tool Registrations used by the backend:

```tsx
import {
  ControlPanel,
  Iterations,
  RenderPerformance,
  Toolbar,
  booleanField,
  controlPanelTool,
  createToolbar,
} from "@riff-refine/belt/react";
import { iterationsTool } from "@riff-refine/belt/iterations";
import { worktreeIterations } from "@riff-refine/belt/iterations/worktrees";
import { portlessResolver } from "@riff-refine/belt/iterations/worktrees/portless";
import { renderPerformanceTool } from "@riff-refine/belt/render-performance";

const AppToolbar = createToolbar({
  tools: [
    iterationsTool({
      providers: [
        worktreeIterations({
          resolver: portlessResolver({
            destinations: [
              {
                id: "web",
                label: "Web",
                appName: "myapp",
                primary: true,
              },
            ],
          }),
        }),
      ],
    }),
    controlPanelTool({
      fieldsets: {
        preview: {
          label: "Preview",
          fields: {
            enabled: booleanField({ default: true, label: "Enabled" }),
          },
        },
      },
    }),
    renderPerformanceTool({
      historySize: 60,
      updateIntervalMs: 1000,
    }),
  ],
});

export function DevToolbar() {
  return (
    <AppToolbar.Provider>
      <Toolbar aria-label="Belt toolbar">
        <Toolbar.Body>
          <Toolbar.Left>
            <Iterations />
            <ControlPanel />
          </Toolbar.Left>
          <Toolbar.Right>
            <RenderPerformance>
              <RenderPerformance.Inp />
              <RenderPerformance.LayoutShift />
              <RenderPerformance.Jank />
            </RenderPerformance>
          </Toolbar.Right>
        </Toolbar.Body>
      </Toolbar>
    </AppToolbar.Provider>
  );
}
```

`createToolbar(...)` returns a typed Toolbar Definition. Its `Provider`, `useToolbarConfig`, `useToolbarDrawer`, and `useToolRegistration` members preserve the concrete Tool Registration types from the config passed to the factory. Ready-made Tool components use those hooks to read their own registration, so host apps should not duplicate Tool config through component props.

Tool Registration config is local renderer config. The Toolbar API returns runtime data such as registered tool metadata, available iterations, and Control Panel snapshots; it is not the source of renderer config. For example, `renderPerformanceTool({ historySize: 60 })` controls measurement options through the local registration, while the metric buttons shown in the toolbar are enabled by rendering `RenderPerformance.Inp`, `RenderPerformance.LayoutShift`, and `RenderPerformance.Jank` as children.

Ready-made Tool components render nothing when their Tool Registration is absent from the active provider. That keeps the public component API simple while still making Tool installation explicit in the Toolbar Config.

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
