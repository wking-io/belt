# Theme CSS

Toolbar renderers use a target-neutral theme contract made from plain CSS custom properties. Host apps can import the default CSS and override variables without adopting a styling library.

```ts
import "@riff-refine/belt/theme.css";
```

When no theme is configured, Toolbar defaults to `system`, which resolves to the built-in `belt-light` or `belt-dark` theme in frontend renderers.

## Tokens

All color values in the default theme use `oklch(...)`, `color-mix(in oklch, ...)`, or `light-dark(...)`. Built-in light and dark values are defined once on each semantic token with `light-dark(...)`; `color-scheme` selects which side is active.

The v1 color contract is:

- `--belt-color-elevation-1` through `--belt-color-elevation-3`
- `--belt-color-elevation-N-hover` and `--belt-color-elevation-N-active`
- `--belt-color-elevation-N-foreground`, `--belt-color-elevation-N-foreground-subtle`, and `--belt-color-elevation-N-foreground-strong`
- `--belt-color-border`, `--belt-color-border-subtle`, and `--belt-color-border-strong`
- `--belt-color-focus`
- `--belt-color-primary`, `--belt-color-info`, `--belt-color-success`, `--belt-color-warning`, and `--belt-color-danger`
- each intent includes `hover`, `active`, `highlight`, `foreground`, `foreground-subtle`, `foreground-strong`, `border`, `overlay`, `overlay-foreground`, `overlay-foreground-subtle`, and `overlay-foreground-strong`

Layout tokens are:

- `--belt-space`
- `--belt-radius-inner`, `--belt-radius`, and `--belt-radius-outer`

Typography tokens are:

- `--belt-font-family`
- `--belt-font-feature-settings`
- `--belt-font-variant-alternates`
- `--belt-font-variant-ligatures`
- `--belt-font-variant-numeric`

The default typography contract uses the package-managed Geist Pixel Square font from `geist` and falls back through Vercel's documented monospace stack. Host apps that import `@repo/theme-css/theme.css` do not need to load Geist Pixel Square separately.

V1 does not include background/surface tokens, selected/highlight tokens, shadows, or a TypeScript spacing helper.

## Surface Classes

The theme CSS also ships portable surface classes so renderers and future React/Rails/Laravel integrations can share the same layered panel treatment without translating framework-specific styles.

```html
<div class="belt-surface" data-elevation="3" data-radius="outer">
  <div class="belt-surface__inner">...</div>
</div>
```

`belt-surface` and `belt-surface__inner` are class hooks shared by every renderer.

Surface styling is selected with attributes:

- `data-elevation="1" | "2" | "3"`
- `data-radius="inner" | "default" | "outer"`
- `data-focused="true"` or `:focus-within` for the focused treatment
- `data-placement="absolute" | "relative"` when placement should be encoded in markup

Radius is contextual. A container with `data-radius="default"` gets `--belt-container-radius: var(--belt-radius)` and exposes `--belt-child-radius: var(--belt-radius-inner)` to nested controls. `data-radius="outer"` maps the container to `--belt-radius-outer` and children to `--belt-radius`; `data-radius="inner"` keeps both at `--belt-radius-inner`. Buttons, ghost buttons, inputs, and similar controls read the inherited child radius instead of taking their own radius prop.

Other component classes follow the same short-attribute convention: `belt-text`, `belt-icon`, `belt-badge`, `belt-status-banner`, `belt-field`, `belt-label`, `belt-input`, `belt-slider`, `belt-switch`, `belt-menu__*`, `belt-select__*`, and `belt-combobox__*`.

## Theme Registration

Theme registration lives in Toolbar config. A string selects the initial built-in or registered theme:

```ts
import { defineToolbar } from "@riff-refine/belt";

export default defineToolbar({
  theme: "belt-dark",
  tools: [],
});
```

Omitting `theme` is equivalent to `theme: "system"`.

Custom themes are partial and inherit from another theme. The theme `mode` controls the emitted `color-scheme`; custom variables can be fixed values or their own `light-dark(...)` expressions.

```ts
import { defineTheme, defineToolbar } from "@riff-refine/belt";

export default defineToolbar({
  theme: {
    default: "my-dark",
    themes: [
      defineTheme({
        id: "my-dark",
        name: "My Dark",
        mode: "dark",
        extends: "belt-dark",
        variables: {
          "--belt-color-elevation-1": "oklch(18% 0.01 255)",
          "--belt-color-primary": "oklch(70% 0.18 260)",
        },
      }),
    ],
  },
  tools: [],
});
```

Theme variables must use the `--belt-` prefix. Color variables should remain OKLCH-based so downstream renderers can safely compose colors with `color-mix(in oklch, ...)`.
