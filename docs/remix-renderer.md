# Remix Renderer

`@repo/renderer-remix` is the first target component library for Belt frontend work. It is built for the Remix 3 UI component model from `@remix-run/ui`, not React.

## Shape

The renderer exports two kinds of primitives:

- Component wrappers for behavior or structure that Belt wants to standardize.
- Mixins for styles that are independent of a specific host element.

Use component wrappers when the primitive owns markup or behavior. Use mixins when the caller should own the element but still use the Belt theme contract.

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

## Mixins

Style-only needs are mixins instead of components:

- `textStyle`
- `badgeStyle`
- `iconStyle`
- `gapStyle`
- `radiusStyle`

The package also exports the component style mixins used internally, such as `buttonBaseStyle`, `inputStyle`, `menuListStyle`, and `optionStyle`, so downstream tools and agents can compose custom elements without inventing a parallel visual vocabulary.

## Theme Contract

All styles are plain CSS generated through Remix UI mixins and reference the CSS custom properties from `@repo/theme-css`. Colors must use the `--belt-color-*` OKLCH token contract rather than hard-coded color values.

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

The example document loads Inter from Google Fonts, and the app chrome applies the same typography contract as the renderer primitives: `var(--belt-font-family)`, `var(--belt-font-feature-settings)`, and the `font-variant-*` typography tokens.

Run the example app and open `/primitives`:

```sh
pnpm --filter remix-app-example dev
```

The same route can also be rendered to a local static file for quick review:

```sh
pnpm --filter remix-app-example preview:primitives
```

The preview UI follows the bookstore demo's feature-action layout: `examples/remix-app/app/actions/primitives/controller.ts` owns the route action and `examples/remix-app/app/actions/primitives/index-page.ts` owns the page. The script fetches the app router's `/primitives` route and writes `examples/remix-app/primitive-preview.html`; the generated HTML is ignored by Git.
