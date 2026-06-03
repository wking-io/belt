// @jsxRuntime classic
// @jsx createElement
// oxlint-disable-next-line no-unused-vars -- Remix UI classic JSX needs the factory in scope.
import { createElement, type Handle, type Props, type RemixElement } from "@remix-run/ui";
import {
  glyphDefinitions,
  glyphIds,
  glyphNames,
  type GlyphDefinition,
  type GlyphName,
  type GlyphNode,
} from "@repo/glyphs";

export type GlyphSheetProps = Omit<Props<"svg">, "children">;
export type GlyphProps = Omit<Props<"svg">, "children"> & {
  readonly name: GlyphName;
};
export type GlyphValues = {
  readonly [name in GlyphName]: RemixElement;
};
export type GlyphSheetComponent = ((handle: Handle<GlyphSheetProps>) => () => RemixElement) & {
  readonly ids: Readonly<Record<GlyphName, string>>;
  readonly values: GlyphValues;
};
export type { GlyphDefinition, GlyphName, GlyphNode };
export { glyphDefinitions, glyphIds, glyphNames };

export const GlyphSheet: GlyphSheetComponent = Object.assign(renderGlyphSheet, {
  ids: glyphIds,
  values: createRemixGlyphValues(),
});
export const ToolbarGlyphSheet = GlyphSheet;

export function Glyph(handle: Handle<GlyphProps>) {
  return () => {
    const { fill, name, ...svgProps } = handle.props;
    const hiddenByDefault =
      handle.props["aria-hidden"] === undefined &&
      handle.props["aria-label"] === undefined &&
      handle.props["aria-labelledby"] === undefined;

    return createElement(
      "svg",
      {
        ...svgProps,
        "aria-hidden": hiddenByDefault ? true : handle.props["aria-hidden"],
        fill: fill ?? "none",
        xmlns: "http://www.w3.org/2000/svg",
      },
      createElement("use", {
        xlinkHref: `#${glyphIds[name]}`,
      }),
    );
  };
}

function renderGlyphSheet(handle: Handle<GlyphSheetProps>) {
  return () => {
    const { style, ...svgProps } = handle.props;
    const hiddenStyle = {
      height: "0",
      overflow: "hidden",
      pointerEvents: "none",
      position: "absolute",
      width: "0",
    };
    const nextStyle =
      typeof style === "object" && style !== null ? { ...hiddenStyle, ...style } : hiddenStyle;

    return createElement(
      "svg",
      {
        ...svgProps,
        "aria-hidden": handle.props["aria-hidden"] ?? true,
        focusable: handle.props.focusable ?? "false",
        height: handle.props.height ?? "0",
        style: nextStyle,
        width: handle.props.width ?? "0",
        xmlns: "http://www.w3.org/2000/svg",
      },
      glyphNames.map((name) => renderSymbol(name, glyphDefinitions[name])),
    );
  };
}

function createRemixGlyphValues(): GlyphValues {
  return Object.fromEntries(
    glyphNames.map((name) => [name, renderSymbol(name, glyphDefinitions[name])]),
  ) as GlyphValues;
}

function renderSymbol(name: GlyphName, definition: GlyphDefinition): RemixElement {
  return createElement(
    "symbol",
    {
      ...definition.attrs,
      id: glyphIds[name],
      viewBox: definition.viewBox,
    },
    definition.children.map((node, index) => renderNode(node, `${name}-${index}`)),
  );
}

function renderNode(node: GlyphNode, key: string): RemixElement {
  return createElement(node.tag, {
    ...node.attrs,
    key,
  });
}
