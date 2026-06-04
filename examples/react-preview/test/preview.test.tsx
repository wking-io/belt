import { assert, it } from "@effect/vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReactPreviewApp } from "../src/preview.tsx";

it("renders the live toolbar with ready-made tool components", () => {
  const html = renderToStaticMarkup(createElement(ReactPreviewApp));

  assert.match(html, /belt-iterations-toolbar-item/);
  assert.match(html, /belt-control-panel-toolbar-item/);
  assert.match(html, /belt-render-performance-toolbar-item/);
  assert.match(html, /aria-label="Open Control Panel"/);
  assert.match(html, /Render performance, jank collecting/);
});
