import { assert, it } from "@effect/vitest";
import { createElement, type RemixNode } from "@remix-run/ui";
import { renderToStream } from "@remix-run/ui/server";
import {
  badgeStyle,
  Button,
  Combobox,
  ComboboxOption,
  Field,
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
  textStyle,
} from "../src/index.tsx";

it("renders the core primitive wrappers through Remix UI server rendering", async () => {
  const html = await render(
    createElement(
      Panel,
      { className: "outer-panel", elevation: 2, innerClassName: "inner-panel" },
      createElement(Button, { tone: "primary" }, "Launch"),
      createElement(GhostButton, { tone: "danger" }, "Delete"),
      createElement(
        StatusBanner.Root,
        { tone: "warning" },
        createElement(
          StatusBanner.Row,
          null,
          createElement(StatusBanner.Icon, null, "!"),
          createElement(StatusBanner.Message, null, "Unsaved changes"),
        ),
      ),
    ),
  );

  assert.match(html, /data-belt-panel/);
  assert.match(html, /data-belt-surface/);
  assert.match(html, /data-belt-surface-inner/);
  assert.match(html, /data-belt-surface-elevation="2"/);
  assert.match(html, /belt-surface belt-panel outer-panel/);
  assert.match(html, /belt-surface__inner inner-panel/);
  assert.match(html, /outer-panel/);
  assert.match(html, /inner-panel/);
  assert.match(html, /Launch/);
  assert.match(html, /Delete/);
  assert.match(html, /Unsaved changes/);
  assert.match(html, /var\(--belt-color-primary-control\)/);
  assert.match(html, /var\(--belt-color-warning\)/);
});

it("renders form primitives and style-only mixins", async () => {
  const html = await render(
    createElement(
      Field,
      null,
      createElement(Label, { for: "branch" }, "Branch"),
      createElement(Input, { id: "branch", placeholder: "feature/name" }),
      createElement(Slider, { min: 0, max: 10 }),
      createElement(Switch, { checked: true }),
      createElement("span", { mix: textStyle({ tone: "subtle", size: "xs" }) }, "quiet text"),
      createElement("span", { mix: badgeStyle({ tone: "success" }) }, "ready"),
    ),
  );

  assert.match(html, /Branch/);
  assert.match(html, /placeholder="feature\/name"/);
  assert.match(html, /type="range"/);
  assert.match(html, /role="switch"/);
  assert.match(html, /quiet text/);
  assert.match(html, /ready/);
  assert.match(html, /var\(--belt-color-foreground-subtle\)/);
  assert.match(html, /var\(--belt-color-success\)/);
  assert.match(html, /var\(--belt-font-family/);
  assert.match(html, /var\(--belt-font-feature-settings/);
  assert.match(html, /var\(--belt-font-variant-ligatures/);
  assert.match(html, /var\(--belt-font-variant-numeric/);
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
