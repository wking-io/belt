import { assert, it } from "@effect/vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Glyph, GlyphSheet, glyphIds, type GlyphName } from "../src/index.ts";

it("renders a hidden svg sprite sheet with Remix-compatible symbol ids", () => {
  const html = renderToStaticMarkup(createElement(GlyphSheet));

  assert.match(html, /<svg/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /id="rmx-glyph-add"/);
  assert.match(html, /id="rmx-glyph-trash"/);
});

it("renders svg use elements with decorative defaults", () => {
  const html = renderToStaticMarkup(createElement(Glyph, { name: "search" }));

  assert.match(html, /<svg/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, new RegExp(`#${glyphIds.search}`));
});

it("preserves labels and host svg props", () => {
  const html = renderToStaticMarkup(createElement(Glyph, { "aria-label": "Search", name: "search", viewBox: "0 0 20 20", width: 24 }));

  assert.match(html, /aria-label="Search"/);
  assert.match(html, /viewBox="0 0 20 20"/);
  assert.match(html, /width="24"/);
  assert.notMatch(html, /aria-hidden/);
});

it("keeps glyph names typed", () => {
  const name: GlyphName = "copy";

  assert.strictEqual(name, "copy");

  // @ts-expect-error unknown glyph names should be rejected
  const invalidName: GlyphName = "unknown";

  assert.strictEqual(invalidName, "unknown");
});
