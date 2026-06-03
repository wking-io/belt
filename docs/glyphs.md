# Glyphs

`@repo/glyphs` builds the shared glyph contract from SVG files in `packages/glyphs/icons`.
React and Remix renderers both consume the generated `glyphNames`, `glyphIds`, and `glyphDefinitions` exports.

## Adding Icons

Add an SVG file to `packages/glyphs/icons`.
The file name becomes the glyph name:

- `search.svg` -> `search`
- `chevron-down.svg` -> `chevronDown`

SVG files must have a `viewBox` and at least one supported shape element:

- `circle`
- `line`
- `path`
- `polyline`
- `rect`

Groups are flattened and inherited paint/stroke attributes are copied to their children.
Unsupported elements fail generation so renderer glyphs stay portable.

Regenerate the typed contract:

```sh
pnpm --filter @repo/glyphs build:glyphs
```

Check that the generated file is current:

```sh
pnpm --filter @repo/glyphs check:glyphs
```

`pnpm --filter @repo/glyphs build` runs generation before TypeScript compilation, and
`pnpm --filter @repo/glyphs check` verifies the generated file before typechecking.
