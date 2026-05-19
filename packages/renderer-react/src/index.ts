import { createElement, type CSSProperties, type ReactElement, type SVGProps } from "react";
import { glyphDefinitions, glyphIds, glyphNames, type GlyphDefinition, type GlyphName, type GlyphNode } from "@repo/glyphs";

export type { GlyphDefinition, GlyphName, GlyphNode } from "@repo/glyphs";
export { glyphDefinitions, glyphIds, glyphNames } from "@repo/glyphs";

export type GlyphSheetProps = Omit<SVGProps<SVGSVGElement>, "children">;

export type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  readonly name: GlyphName;
};

export function GlyphSheet(props: GlyphSheetProps): ReactElement {
  const { style, ...svgProps } = props;
  const hiddenStyle = {
    position: "absolute",
    width: "0",
    height: "0",
    overflow: "hidden",
    pointerEvents: "none",
    ...style
  } satisfies CSSProperties;

  return createElement(
    "svg",
    {
      ...svgProps,
      "aria-hidden": props["aria-hidden"] ?? true,
      focusable: props.focusable ?? "false",
      height: props.height ?? "0",
      style: hiddenStyle,
      width: props.width ?? "0",
      xmlns: "http://www.w3.org/2000/svg"
    },
    glyphNames.map((name) => renderSymbol(name, glyphDefinitions[name]))
  );
}

GlyphSheet.ids = glyphIds;
GlyphSheet.values = glyphDefinitions;

export function Glyph(props: GlyphProps): ReactElement {
  const { fill, name, ...svgProps } = props;
  const hiddenByDefault = props["aria-hidden"] === undefined && props["aria-label"] === undefined && props["aria-labelledby"] === undefined;

  return createElement(
    "svg",
    {
      ...svgProps,
      "aria-hidden": hiddenByDefault ? true : props["aria-hidden"],
      fill: fill ?? "none",
      xmlns: "http://www.w3.org/2000/svg"
    },
    createElement("use", {
      xlinkHref: `#${glyphIds[name]}`
    })
  );
}

function renderSymbol(name: GlyphName, definition: GlyphDefinition): ReactElement {
  return createElement(
    "symbol",
    {
      ...toReactAttrs(definition.attrs),
      id: glyphIds[name],
      key: name,
      viewBox: definition.viewBox
    },
    definition.children.map((node, index) => renderNode(node, `${name}-${index}`))
  );
}

function renderNode(node: GlyphNode, key: string): ReactElement {
  return createElement(node.tag, {
    ...toReactAttrs(node.attrs),
    key
  });
}

function toReactAttrs(attrs: GlyphDefinition["attrs"]): Record<string, string | number> {
  const nextAttrs: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(attrs ?? {})) {
    nextAttrs[reactAttributeName(key)] = value;
  }

  return nextAttrs;
}

function reactAttributeName(name: string): string {
  if (name === "stroke-linecap") return "strokeLinecap";
  if (name === "stroke-linejoin") return "strokeLinejoin";
  if (name === "stroke-width") return "strokeWidth";

  return name;
}
