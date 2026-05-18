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
- `--belt-color-elevation-N-hover`, `--belt-color-elevation-N-active`, and `--belt-color-elevation-N-inset`
- `--belt-color-foreground`, `--belt-color-foreground-subtle`, and `--belt-color-foreground-strong`
- `--belt-color-border`, `--belt-color-border-subtle`, and `--belt-color-border-strong`
- `--belt-color-focus`
- `--belt-color-primary`, `--belt-color-info`, `--belt-color-success`, `--belt-color-warning`, and `--belt-color-danger`
- each intent includes `foreground`, `foreground-subtle`, `foreground-strong`, `control`, `control-hover`, `control-active`, `control-foreground`, `control-foreground-subtle`, and `control-foreground-strong`

Layout tokens are:

- `--belt-space`
- numbered spacing variables such as `--belt-space-1`, `--belt-space-2`, and `--belt-space-12`
- `--belt-radius-inner`, `--belt-radius`, and `--belt-radius-outer`

Typography tokens are:

- `--belt-font-family`
- `--belt-font-feature-settings`
- `--belt-font-variant-alternates`
- `--belt-font-variant-ligatures`
- `--belt-font-variant-numeric`

The default typography contract uses Inter and enables `calt`, `dlig`, `case`, `ccmp`, `zero`, `ss01`, `ss02`, `ss07`, `ss08`, `cv06`, and `cv11`. It also opts into common, discretionary, and contextual ligatures plus slashed zero through `font-variant-*` tokens. The theme CSS defines the family and feature settings, but it does not load font files. Host apps should load Inter however they already manage fonts.

V1 does not include background/surface tokens, selected/highlight tokens, shadows, or a TypeScript spacing helper.

## Surface Classes

The theme CSS also ships portable surface classes so renderers and future React/Rails/Laravel integrations can share the same layered panel treatment without translating framework-specific styles.

```html
<div
  class="belt-surface"
  data-belt-surface
  data-belt-surface-elevation="3"
  data-belt-surface-size="surface-default"
  data-belt-surface-variant="default"
>
  <div class="belt-surface__inner" data-belt-surface-inner>
    ...
  </div>
</div>
```

`belt-surface` and `belt-surface__inner` are class hooks. The equivalent `data-belt-surface` and `data-belt-surface-inner` attributes are also supported for adapters that prefer attribute-only markup.

Surface variants are selected with attributes:

- `data-belt-surface-elevation="1" | "2" | "3"`
- `data-belt-surface-size="control-sm" | "control-default" | "control-lg" | "surface-sm" | "surface-default" | "surface-lg"`
- `data-belt-surface-variant="default" | "elevated" | "inset" | "inset-subtle"`
- `data-focused="true"` or `:focus-within` for the focused treatment
- `data-belt-placement="absolute" | "relative"` when placement should be encoded in markup

The legacy `belt-panel` and `data-belt-panel` hooks currently alias the surface styles.

## Theme Registration

Theme registration lives in Toolbar config. A string selects the initial built-in or registered theme:

```ts
import { defineToolbar } from "@riff-refine/belt";

export default defineToolbar({
  theme: "belt-dark",
  tools: []
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
          "--belt-color-primary-control": "oklch(70% 0.18 260)"
        }
      })
    ]
  },
  tools: []
});
```

Theme variables must use the `--belt-` prefix. Color variables should remain OKLCH-based so downstream renderers can safely compose colors with `color-mix(in oklch, ...)`.
