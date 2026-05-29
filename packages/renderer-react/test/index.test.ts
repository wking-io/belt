import { assert, it } from "@effect/vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Button,
  DragIndicator,
  Field,
  GhostButton,
  Glyph,
  GlyphSheet,
  Input,
  Label,
  Menu,
  MenuItem,
  Panel,
  Select,
  SelectOption,
  Slider,
  StatusBanner,
  Switch,
  Toolbar,
  glyphIds,
  type GlyphName,
} from "../src/index.tsx";

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
  const html = renderToStaticMarkup(
    createElement(Glyph, {
      "aria-label": "Search",
      name: "search",
      viewBox: "0 0 20 20",
      width: 24,
    }),
  );

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

it("renders React primitives with the shared CSS class contract", () => {
  const html = renderToStaticMarkup(
    createElement(
      Panel,
      { elevation: 2 },
      createElement(Button, { tone: "primary", startIcon: "add" }, "Launch"),
      createElement(GhostButton, { tone: "danger" }, "Delete"),
      createElement(DragIndicator),
      createElement(
        Toolbar,
        { defaultPosition: { x: 24, y: 32 } },
        createElement(Button, { icon: "check" }),
        createElement("span", { className: "belt-text" }, "Toolbar"),
      ),
      createElement(
        StatusBanner.Root,
        { tone: "primary" },
        createElement(
          StatusBanner.Row,
          null,
          createElement(StatusBanner.Icon, { glyph: "alert" }),
          createElement(StatusBanner.Message, null, "Unsaved changes"),
          createElement(StatusBanner.Actions, null, createElement(GhostButton, null, "Undo")),
        ),
      ),
    ),
  );

  assert.match(html, /belt-surface/);
  assert.match(html, /data-elevation="2"/);
  assert.match(html, /data-radius="outer"/);
  assert.match(html, /belt-button/);
  assert.match(html, /belt-ghost-button/);
  assert.match(html, /belt-drag-indicator/);
  assert.match(html, /belt-drag-indicator__dot/);
  assert.match(html, /belt-toolbar/);
  assert.match(html, /belt-toolbar__inner/);
  assert.match(html, /--belt-toolbar-x:24px/);
  assert.match(html, /--belt-toolbar-y:32px/);
  assert.match(html, /belt-status-banner/);
  assert.match(html, /data-radius="default"/);
  assert.match(html, /data-tone="primary"/);
  assert.match(html, new RegExp(`#${glyphIds.alert}`));
  assert.match(html, /belt-status-banner__actions/);
});

it("lets React containers set radius while controls inherit it", () => {
  const html = renderToStaticMarkup(
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

  assert.match(
    html,
    /belt-surface[^>]*data-radius="default"|data-radius="default"[^>]*belt-surface/,
  );
  assert.match(
    html,
    /belt-status-banner[^>]*data-radius="outer"|data-radius="outer"[^>]*belt-status-banner/,
  );
  assert.match(html, /belt-button/);
  assert.match(html, /belt-ghost-button/);
  assert.notMatch(html, /belt-button[^>]*data-radius/);
  assert.notMatch(html, /belt-ghost-button[^>]*data-radius/);
});

it("renders Base UI-backed form and choice primitives", () => {
  const html = renderToStaticMarkup(
    createElement(
      Field,
      null,
      createElement(Label, null, "Branch"),
      createElement(Input, { placeholder: "feature/name" }),
      createElement(Slider, { defaultValue: 4, min: 0, max: 10, label: "Intensity", unit: "%" }),
      createElement(Switch, { defaultChecked: true }),
      createElement(Menu, { label: "Menu" }, createElement(MenuItem, null, "Open worktree")),
      createElement(
        Select,
        { defaultLabel: "Destination" },
        createElement(SelectOption, { value: "web" }, "Web"),
      ),
    ),
  );

  assert.match(html, /belt-field/);
  assert.match(html, /belt-label/);
  assert.match(html, /belt-input/);
  assert.match(html, /belt-slider/);
  assert.match(html, /belt-slider__header/);
  assert.match(html, /belt-slider__label/);
  assert.match(html, /Intensity/);
  assert.match(html, /belt-slider__value/);
  assert.match(html, /belt-slider__value-text/);
  assert.match(html, /belt-slider__unit/);
  assert.match(html, /belt-switch/);
  assert.match(html, /belt-menu__trigger/);
  assert.match(html, /belt-select__trigger/);
});
