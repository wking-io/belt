import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { assert, it } from "@effect/vitest";
import { createElement, type RemixNode } from "@remix-run/ui";
import { renderToStream } from "@remix-run/ui/server";
import {
  Button,
  Combobox,
  ComboboxOption,
  Field,
  Glyph,
  GlyphSheet,
  GhostButton,
  Input,
  Label,
  Menu,
  MenuItem,
  MenuList,
  Panel,
  Select,
  SelectOption,
  Slider,
  StatusBanner,
  Switch,
} from "../src/index.tsx";

const rendererSourcePath = fileURLToPath(new URL("../src/index.tsx", import.meta.url));

it("renders the core primitive wrappers through Remix UI server rendering", async () => {
  const html = await render(
    createElement(
      Panel,
      { className: "outer-panel", elevation: 2 },
      createElement(Button, { tone: "primary" }, "Launch"),
      createElement(GhostButton, { tone: "danger" }, "Delete"),
      createElement(
        StatusBanner.Root,
        { tone: "warning" },
        createElement(
          StatusBanner.Row,
          null,
          createElement(StatusBanner.Icon, { glyph: "alert" }),
          createElement(StatusBanner.Message, null, "Unsaved changes"),
        ),
      ),
    ),
  );

  assert.match(html, /data-elevation="2"/);
  assert.match(html, /data-radius="outer"/);
  assert.match(html, /data-radius="default"/);
  assert.match(html, /belt-surface outer-panel/);
  assert.match(html, /belt-surface__inner/);
  assert.match(html, /outer-panel/);
  assert.match(html, /Launch/);
  assert.match(html, /Delete/);
  assert.match(html, /Unsaved changes/);
  assert.match(html, /data-tone="primary"/);
  assert.match(html, /data-tone="danger"/);
  assert.match(html, /belt-status-banner/);
  assert.match(html, /data-tone="warning"/);
});

it("lets containers set radius while controls inherit it", async () => {
  const html = await render(
    createElement(
      Panel,
      { radius: "default" },
      createElement(Button, null, "Save"),
      createElement(
        StatusBanner.Root,
        { radius: "outer", tone: "info" },
        createElement(StatusBanner.Action, null, createElement(GhostButton, null, "Undo")),
      ),
    ),
  );

  assert.match(html, /data-radius="default"[^>]*belt-surface/);
  assert.match(html, /data-radius="outer"[^>]*belt-status-banner/);
  assert.match(html, /belt-button/);
  assert.match(html, /belt-ghost-button/);
  assert.notMatch(html, /belt-button[^>]*data-radius/);
  assert.notMatch(html, /belt-ghost-button[^>]*data-radius/);
});

it("renders form primitives and portable class hooks", async () => {
  const html = await render(
    createElement(
      Field,
      null,
      createElement(Label, { for: "branch" }, "Branch"),
      createElement(Input, { id: "branch", placeholder: "feature/name" }),
      createElement(Slider, {
        class: "custom-slider",
        defaultValue: 4,
        id: "intensity",
        label: "Intensity",
        min: 0,
        max: 10,
        name: "intensity",
        unit: "%",
      }),
      createElement(Switch, { checked: true }),
      createElement(
        "span",
        { class: "belt-text", "data-emphasis": "subtle", "data-size": "xs" },
        "quiet text",
      ),
      createElement("span", { class: "belt-badge", "data-tone": "success" }, "ready"),
    ),
  );

  assert.match(html, /Branch/);
  assert.match(html, /placeholder="feature\/name"/);
  assert.match(html, /type="range"/);
  assert.match(html, /role="switch"/);
  assert.match(html, /quiet text/);
  assert.match(html, /ready/);
  assert.match(html, /belt-field/);
  assert.match(html, /belt-label/);
  assert.match(html, /belt-input/);
  assert.match(html, /belt-slider custom-slider/);
  assert.match(html, /role="group"/);
  assert.match(html, /belt-slider__header/);
  assert.match(html, /<label[^>]*class="belt-slider__label"/);
  assert.match(html, /<label[^>]*for="intensity"/);
  assert.match(html, />Intensity<\/label>/);
  assert.match(html, /belt-slider__value/);
  assert.match(html, /belt-slider__value-text/);
  assert.match(html, /belt-slider__unit/);
  assert.match(html, /belt-slider__control/);
  assert.match(html, /belt-slider__track/);
  assert.match(html, /belt-slider__indicator/);
  assert.match(html, /belt-slider__thumb/);
  assert.match(html, /aria-valuenow="4"/);
  assert.match(html, /--belt-slider-value:\s*40%/);
  assert.notMatch(html, /belt-slider__indicator[^>]*style="[^"]*width:/);
  assert.match(html, /pointer-events:\s*none/);
  assert.match(
    html,
    /<input[^>]*name="intensity"[^>]*aria-orientation="horizontal"[^>]*aria-valuenow="4"[^>]*type="range"/,
  );
  assert.notMatch(html, /<input[^>]*type="range"[^>]*style="[^"]*clip-path:\s*inset\(50%\)/);
  assert.match(html, /name="intensity"/);
  assert.match(html, /belt-switch/);
  assert.match(html, /belt-switch__thumb/);
  assert.match(html, /<input[^>]*aria-hidden="true"[^>]*tabindex="-1"[^>]*type="checkbox"/);
  assert.match(html, /belt-text/);
  assert.match(html, /belt-badge/);
});

it("keeps slider range input out of Remix UI controlled reflection", async () => {
  const source = await readFile(rendererSourcePath, "utf8");

  assert.match(source, /defaultValue=\{resolvedValue\}/);
  assert.notMatch(source, /value=\{resolvedValue\}/);
});

it("keeps switch checkbox bound to local checked state", async () => {
  const source = await readFile(rendererSourcePath, "utf8");

  assert.match(
    source,
    /let checkedState = Boolean\(handle\.props\.checked \?\? handle\.props\.defaultChecked\)/,
  );
  assert.match(source, /checked=\{checkedState\}/);
  assert.notMatch(source, /checked=\{checked\}/);
});

it("exports thin Remix UI wrappers for composed controls", () => {
  assert.strictEqual(typeof Menu, "function");
  assert.strictEqual(typeof MenuItem, "function");
  assert.strictEqual(typeof MenuList, "function");
  assert.strictEqual(typeof Select, "function");
  assert.strictEqual(typeof SelectOption, "function");
  assert.strictEqual(typeof Combobox, "function");
  assert.strictEqual(typeof ComboboxOption, "function");
});

it("renders the shared toolbar glyph sheet through Remix UI", async () => {
  const sheetHtml = await render(createElement(GlyphSheet, null));
  const glyphHtml = await render(createElement(Glyph, { name: "search" }));
  const labelledGlyphHtml = await render(
    createElement(Glyph, {
      "aria-label": "Search",
      name: "search",
      viewBox: "0 0 20 20",
      width: "24",
    }),
  );

  assert.match(sheetHtml, /<svg/);
  assert.match(sheetHtml, /aria-hidden/);
  assert.match(sheetHtml, /id="rmx-glyph-add"/);
  assert.match(sheetHtml, /id="rmx-glyph-trash"/);
  assert.match(glyphHtml, /aria-hidden/);
  assert.match(glyphHtml, /#rmx-glyph-search/);
  assert.match(labelledGlyphHtml, /aria-label="Search"/);
  assert.match(labelledGlyphHtml, /viewBox="0 0 20 20"/);
  assert.match(labelledGlyphHtml, /width="24"/);
});

async function render(node: RemixNode): Promise<string> {
  const reader = renderToStream(node).getReader();
  const decoder = new TextDecoder();
  let html = "";

  while (true) {
    const result = await reader.read();

    if (result.done) break;

    html += decoder.decode(result.value, { stream: true });
  }

  return html + decoder.decode();
}
