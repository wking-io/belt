// @jsxRuntime classic
// @jsx createElement
// oxlint-disable-next-line no-unused-vars -- Remix UI classic JSX needs the factory in scope.
import { createElement, type RemixElement } from "@remix-run/ui";
import {
  createGlyphSheet,
  Glyph,
  type GlyphProps,
  type GlyphSheetComponent,
  type GlyphValues
} from "@remix-run/ui/glyph";
import { glyphDefinitions, glyphIds, glyphNames, type GlyphDefinition, type GlyphName, type GlyphNode } from "@repo/glyphs";

export type { GlyphDefinition, GlyphName, GlyphNode, GlyphProps };
export { Glyph, glyphDefinitions, glyphIds, glyphNames };

export const GlyphSheet: GlyphSheetComponent = createGlyphSheet(createRemixGlyphValues());
export const ToolbarGlyphSheet = GlyphSheet;

function createRemixGlyphValues(): GlyphValues {
  return Object.fromEntries(glyphNames.map((name) => [name, renderSymbol(name, glyphDefinitions[name])])) as GlyphValues;
}

function renderSymbol(name: GlyphName, definition: GlyphDefinition): RemixElement {
  return createElement(
    "symbol",
    {
      ...definition.attrs,
      id: glyphIds[name],
      viewBox: definition.viewBox
    },
    definition.children.map((node, index) => renderNode(node, `${name}-${index}`))
  );
}

function renderNode(node: GlyphNode, key: string): RemixElement {
  return createElement(node.tag, {
    ...node.attrs,
    key
  });
}
