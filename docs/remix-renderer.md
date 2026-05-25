# Remix Renderer

`@repo/renderer-remix` is the first target component library for Belt frontend work. It is built for the Remix 3 UI component model from `@remix-run/ui`, not React.

## Shape

The renderer exports component wrappers for behavior or structure that Belt wants to standardize. Styles live in `@repo/theme-css` as portable CSS class and `data-*` hooks so other renderers can reuse the same visual contract.

## Components

The v1 component set is intentionally small because Belt is a compact dev toolbar surface:

- `Panel`: always renders an outer and inner element so bordered/elevated surfaces have stable structure.
- `Button`: one small control size with neutral and intent tones.
- `GhostButton`: one small control size for lower-emphasis actions.
- `StatusBanner`: compound status messaging primitives.
- `Label`, `Field`, `Input`, `Switch`, `Slider`: compact form primitives.
- `Menu`, `MenuItem`, `MenuList`, `Submenu`: thin wrappers over Remix UI menu behavior.
- `Select`, `SelectOption`: thin wrappers over Remix UI select behavior.
- `Combobox`, `ComboboxOption`: thin wrappers over Remix UI combobox behavior.
- `GlyphSheet`: Belt's shared SVG sprite sheet, generated with Remix UI's `createGlyphSheet`.
- `Glyph`: re-exported from Remix UI and backed by the shared Belt glyph ids.

## CSS Hooks

Style-only needs use CSS classes directly:

- `belt-text` with `data-emphasis`, `data-size`, and `data-weight`
- `belt-badge` with `data-tone`
- `belt-icon` with intent `data-tone`, `data-emphasis`, and `data-size`
- `belt-gap` with `data-gap`
- `belt-radius` with `data-size`

Component wrappers emit the same classes and short `data-*` attributes used by React and future renderers.

`Panel` owns the outer surface radius and defaults to `radius="outer"`. `StatusBanner.Root` defaults to `radius="default"` for the common case where it sits inside an outer panel. Controls do not expose a radius prop; `Button`, `GhostButton`, `Input`, and related trigger controls inherit the active child radius from the nearest `data-radius` container.

## Theme Contract

All styles are plain CSS in `@repo/theme-css` and reference the `--belt-color-*` OKLCH token contract rather than hard-coded color values.

Renderers should import the default theme CSS once at the app boundary, then use these primitives inside the toolbar shell and tool renderers.

Render the glyph sheet once near the app root before rendering `Glyph` instances:

```tsx
import { Glyph, GlyphSheet } from "@repo/renderer-remix";

<body>
  <GlyphSheet />
  <button aria-label="Search">
    <Glyph name="search" />
  </button>
</body>;
```

## Visual Review

The Remix example includes a real Remix 3 app shape based on the upstream template: `server.ts`, `app/router.ts`, `app/routes.ts`, controller actions, and UI document/layout modules.

The example document uses the bundled Inter font files from `@repo/theme-css/theme.css`, and the app chrome applies the same typography contract as the renderer primitives: `var(--belt-font-family)`, `var(--belt-font-feature-settings)`, and the `font-variant-*` typography tokens.

Run the example app and open `/primitives`:

```sh
pnpm --filter remix-app-example dev
```

The same route can also be rendered to a local static file for quick review:

```sh
pnpm --filter remix-app-example preview:primitives
```

The preview UI follows the bookstore demo's feature-action layout: `examples/remix-app/app/actions/primitives/controller.ts` owns the route action and `examples/remix-app/app/actions/primitives/index-page.ts` owns the page. The script fetches the app router's `/primitives` route and writes `examples/remix-app/primitive-preview.html`; the generated HTML is ignored by Git.
