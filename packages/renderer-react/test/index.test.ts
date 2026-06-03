import { assert, it } from "@effect/vitest";
import { controlField, controlPanelTool, controlPanelToolId } from "@repo/control-panel-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Button,
  Combobox,
  DragIndicator,
  Field,
  GhostButton,
  Glyph,
  GlyphSheet,
  Input,
  Label,
  Menu,
  Panel,
  Select,
  Slider,
  StatusBanner,
  Switch,
  Toolbar,
  createToolbar,
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
        null,
        createElement(
          Toolbar.Body,
          null,
          createElement(
            Toolbar.Left,
            null,
            createElement("span", { className: "belt-text" }, "Toolbar"),
          ),
          createElement(Toolbar.Right, null, createElement(Button, { icon: "check" })),
        ),
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
  assert.match(html, /belt-toolbar__body/);
  assert.match(html, /belt-toolbar__left/);
  assert.match(html, /belt-toolbar__right/);
  assert.notMatch(html, /--belt-toolbar-x/);
  assert.notMatch(html, /--belt-toolbar-y/);
  assert.match(html, /belt-status-banner/);
  assert.match(html, /data-radius="default"/);
  assert.match(html, /data-tone="primary"/);
  assert.match(html, new RegExp(`#${glyphIds.alert}`));
  assert.match(html, /belt-status-banner__actions/);
});

it("reads typed built-in tool registrations through the toolbar provider", () => {
  const toolbar = createToolbar({
    tools: [
      controlPanelTool({
        fieldsets: {
          layout: {
            fields: {
              width: controlField.number({ default: 640 }),
            },
            label: "Layout",
          },
        },
      }),
    ],
  });

  function ControlPanelProbe() {
    const registration = toolbar.useToolRegistration(controlPanelToolId);
    const config = toolbar.useToolbarConfig();
    const width = registration?.config.fieldsets.layout.fields.width.default;
    const configWidth = config.tools[0]?.config.fieldsets.layout.fields.width.default;

    return createElement("span", null, `${width}:${configWidth}`);
  }

  const html = renderToStaticMarkup(
    createElement(toolbar.Provider, null, createElement(ControlPanelProbe)),
  );

  assert.match(html, />640:640</);
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
      createElement(
        Menu.Root,
        null,
        createElement(Menu.Trigger, null, "Menu"),
        createElement(Menu.List, null, createElement(Menu.Item, null, "Open worktree")),
      ),
      createElement(
        Select.Root,
        null,
        createElement(Select.Trigger, { defaultLabel: "Destination" }),
        createElement(Select.List, null, createElement(Select.Option, { value: "web" }, "Web")),
      ),
      createElement(
        Combobox.Root,
        null,
        createElement(Combobox.Trigger, { placeholder: "Find branch" }),
        createElement(
          Combobox.List,
          null,
          createElement(Combobox.Option, { value: "main" }, "main"),
        ),
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
  assert.match(html, /belt-combobox__trigger/);
  assert.match(html, /belt-button__end-icon/);
  assert.match(html, /belt-icon/);
  assert.match(html, /data-size="md"/);
});

it("lets custom combobox triggers own their surface styles", () => {
  const html = renderToStaticMarkup(
    createElement(
      Combobox.Root,
      null,
      createElement(Combobox.Trigger, {
        render: createElement(GhostButton, { endIcon: "chevronDown" }, "Worktree"),
      }),
      createElement(Combobox.List, null, createElement(Combobox.Option, { value: "main" }, "main")),
    ),
  );

  assert.match(html, /belt-ghost-button/);
  assert.match(html, /belt-combobox__trigger/);
  assert.notMatch(html, /belt-combobox--popup-search/);
  assert.notMatch(html, /belt-surface[^>]*belt-combobox/);
});

it("renders select options without a selected item indicator icon", () => {
  const html = renderToStaticMarkup(
    createElement(Select.Root, null, createElement(Select.Option, { value: "web" }, "Web")),
  );

  assert.match(html, /belt-select__item/);
  assert.match(html, />Web</);
  assert.notMatch(html, /belt-icon/);
  assert.notMatch(html, /rmx-glyph-check/);
});
