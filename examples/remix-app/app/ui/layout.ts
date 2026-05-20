import { css, createElement, type RemixNode } from "remix/ui";
import { GlyphSheet } from "@repo/renderer-remix";
import { routes } from "../routes.ts";
import { document } from "./document.ts";

const appChrome = css({
  "--rmx-font-family-mono": "var(--belt-font-family)",
  "--rmx-font-family-sans": "var(--belt-font-family)",
  background: "var(--belt-color-elevation-1)",
  color: "var(--belt-color-elevation-1-foreground)",
  fontFamily: "var(--belt-font-family)",
  fontFeatureSettings: "var(--belt-font-feature-settings)",
  fontKerning: "normal",
  fontOpticalSizing: "auto",
  fontSynthesis: "none",
  fontVariantAlternates: "var(--belt-font-variant-alternates)",
  fontVariantLigatures: "var(--belt-font-variant-ligatures)",
  fontVariantNumeric: "var(--belt-font-variant-numeric)",
  margin: 0,
  minHeight: "100vh",
  MozOsxFontSmoothing: "grayscale",
  textRendering: "optimizeLegibility",
  WebkitFontSmoothing: "antialiased",
  "& *, & *::before, & *::after": {
    boxSizing: "border-box"
  },
  ".app-shell": {
    display: "grid",
    gap: "28px",
    marginInline: "auto",
    maxWidth: "1120px",
    padding: "28px"
  },
  ".app-header": {
    alignItems: "center",
    display: "flex",
    gap: "16px",
    justifyContent: "space-between"
  },
  ".app-brand": {
    color: "var(--belt-color-elevation-1-foreground-strong)",
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0
  },
  ".app-nav": {
    alignItems: "center",
    display: "flex",
    gap: "10px"
  },
  ".app-nav-link": {
    borderRadius: "var(--belt-radius)",
    color: "var(--belt-color-elevation-1-foreground-subtle)",
    fontSize: "13px",
    fontWeight: 500,
    lineHeight: 1,
    paddingBlock: "8px",
    paddingInline: "10px",
    textDecoration: "none"
  },
  ".app-nav-link:hover": {
    backgroundColor: "var(--belt-color-elevation-2-hover)",
    color: "var(--belt-color-elevation-1-foreground)"
  }
});

export function layout(options: {
  readonly children?: RemixNode;
  readonly title: string;
}) {
  return document({
    bodyMix: appChrome,
    title: options.title,
    children: createElement(
      "div",
      { className: "app-shell belt" },
      createElement(GlyphSheet),
      createElement(
        "header",
        { className: "app-header" },
        createElement("h1", { className: "app-brand" }, "Belt Remix Example"),
        createElement(
          "nav",
          { className: "app-nav" },
          createElement("a", { className: "app-nav-link", href: routes.home.href() }, "Home"),
          createElement("a", { className: "app-nav-link", href: routes.primitives.index.href() }, "Primitives")
        )
      ),
      options.children
    )
  });
}
