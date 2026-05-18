# Theme CSS

Toolbar renderers use a target-neutral theme contract made from plain CSS custom properties. Host apps can import the default CSS and override variables without adopting a styling library.

```ts
import "@repo/theme-css/theme.css";
```

When no theme is configured, Toolbar defaults to `system`, which resolves to the built-in `belt-light` or `belt-dark` theme in frontend renderers.

## Tokens

All color values in the default theme use `oklch(...)` or `color-mix(in oklch, ...)`.

The v1 color contract is:

- `--belt-color-elevation-0` through `--belt-color-elevation-3`
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

V1 does not include background/surface tokens, selected/highlight tokens, shadows, or a TypeScript spacing helper.

## Theme Registration

Theme registration lives in Toolbar config. A string selects the initial built-in or registered theme:

```ts
import { defineToolbar } from "@repo/core";

export default defineToolbar({
  theme: "belt-dark",
  tools: []
});
```

Omitting `theme` is equivalent to `theme: "system"`.

Custom themes are partial and inherit from another theme:

```ts
import { defineTheme, defineToolbar } from "@repo/core";

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
          "--belt-color-elevation-0": "oklch(18% 0.01 255)",
          "--belt-color-primary-control": "oklch(70% 0.18 260)"
        }
      })
    ]
  },
  tools: []
});
```

Theme variables must use the `--belt-` prefix. Color variables should remain OKLCH-based so downstream renderers can safely compose colors with `color-mix(in oklch, ...)`.
