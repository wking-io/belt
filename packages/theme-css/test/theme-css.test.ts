import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { assert, it } from "@effect/vitest";

const themeCssPath = fileURLToPath(new URL("../src/theme.css", import.meta.url));
const interVariablePath = fileURLToPath(
  new URL("../src/font-files/InterVariable.woff2", import.meta.url),
);
const interVariableItalicPath = fileURLToPath(
  new URL("../src/font-files/InterVariable-Italic.woff2", import.meta.url),
);

it("exports the v1 theme token contract", async () => {
  const css = await readFile(themeCssPath, "utf8");

  for (const token of [
    "--belt-color-elevation-1",
    "--belt-color-elevation-1-hover",
    "--belt-color-elevation-1-active",
    "--belt-color-elevation-3",
    "--belt-color-elevation-1-foreground",
    "--belt-color-elevation-1-foreground-subtle",
    "--belt-color-elevation-1-foreground-strong",
    "--belt-color-border",
    "--belt-color-border-subtle",
    "--belt-color-border-strong",
    "--belt-color-focus",
    "--belt-space",
    "--belt-radius-inner",
    "--belt-radius",
    "--belt-radius-outer",
    "--belt-font-family",
    "--belt-font-feature-settings",
    "--belt-font-variant-alternates",
    "--belt-font-variant-ligatures",
    "--belt-font-variant-numeric",
  ]) {
    assert.match(css, new RegExp(`${token}:`));
  }
});

it("sets the default font family and OpenType feature contract", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.match(css, /font-family:\s*"InterVariable"/);
  assert.match(css, /url\("\.\/font-files\/InterVariable\.woff2"\)/);
  assert.match(css, /url\("\.\/font-files\/InterVariable-Italic\.woff2"\)/);
  assert.match(css, /--belt-font-family:\s*"InterVariable",\s*"Inter"/);
  assert.match(css, /@font-feature-values\s+"InterVariable"/);

  for (const feature of [
    "calt",
    "dlig",
    "case",
    "ccmp",
    "zero",
    "ss01",
    "ss02",
    "ss07",
    "ss08",
    "cv06",
    "cv11",
  ]) {
    assert.match(css, new RegExp(`"${feature}" 1`));
  }

  assert.match(
    css,
    /--belt-font-variant-ligatures:\s*common-ligatures discretionary-ligatures contextual/,
  );
  assert.match(css, /--belt-font-variant-numeric:\s*slashed-zero/);
  assert.match(
    css,
    /--belt-font-variant-alternates:[\s\S]*styleset\(ss01\)[\s\S]*character-variant\(cv11\)/,
  );
});

it("ships the bundled Inter variable font files", async () => {
  const [normal, italic] = await Promise.all([
    readFile(interVariablePath),
    readFile(interVariableItalicPath),
  ]);

  assert.ok(normal.length > 0);
  assert.ok(italic.length > 0);
});

it("exports portable component class hooks for renderers", async () => {
  const css = await readFile(themeCssPath, "utf8");

  for (const className of [
    "belt-surface",
    "belt-surface__inner",
    "belt-button",
    "belt-ghost-button",
    "belt-badge",
    "belt-text",
    "belt-icon",
    "belt-drag-indicator",
    "belt-drag-indicator__dot",
    "belt-toolbar",
    "belt-toolbar__inner",
    "belt-radius",
    "belt-gap",
    "belt-input",
    "belt-status-banner",
    "belt-status-banner__row",
    "belt-status-banner__message",
    "belt-field",
    "belt-label",
    "belt-slider",
    "belt-slider__header",
    "belt-slider__value",
    "belt-switch",
    "belt-menu__trigger",
    "belt-menu__popup",
    "belt-menu__item",
    "belt-select__trigger",
    "belt-select__value",
    "belt-select__popup",
    "belt-select__list",
    "belt-select__item",
    "belt-combobox",
    "belt-combobox__popup",
    "belt-combobox__item",
  ]) {
    assert.match(css, new RegExp(`\\.${className.replaceAll("_", "\\_")}`));
  }
});

it("styles select placeholders and selected option tone states", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.match(css, /\.belt-select__value\[data-placeholder\]/);
  assert.match(css, /--belt-select-selected-bg:\s*var\(--belt-color-primary\)/);
  assert.match(css, /--belt-select-selected-fg:\s*var\(--belt-color-primary-foreground\)/);
  assert.match(css, /\.belt-select__item\[aria-selected="true"\]/);
  assert.match(css, /background-color:\s*var\(--belt-select-selected-bg\)/);
  assert.notMatch(css, /belt-select__item-indicator/);
});

it("sets button text with the small font token", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.match(css, /\.belt-button\)[\s\S]*font-size:\s*var\(--belt-font-size-sm\)/);
  assert.match(css, /\.belt-ghost-button\)[\s\S]*font-size:\s*var\(--belt-font-size-sm\)/);
});

it("styles drag indicators with grab and active dragging cursors", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.match(css, /\.belt-drag-indicator\)[\s\S]*cursor:\s*grab/);
  assert.match(css, /\.belt-drag-indicator:active/);
  assert.match(css, /\.belt-drag-indicator\[data-dragging="true"\]/);
  assert.match(css, /cursor:\s*grabbing/);
  assert.match(css, /\.belt-drag-indicator__dot\)[\s\S]*inline-size:\s*4px/);
  assert.match(css, /\.belt-drag-indicator__dot\)[\s\S]*block-size:\s*4px/);
});

it("styles toolbar as a fixed content-sized viewport bounded surface", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.match(css, /\.belt-toolbar\)[\s\S]*inline-size:\s*max-content/);
  assert.match(css, /\.belt-toolbar\)[\s\S]*position:\s*fixed/);
  assert.match(css, /\.belt-toolbar\)[\s\S]*max-inline-size:\s*100vw/);
  assert.match(css, /\.belt-toolbar\)[\s\S]*max-block-size:\s*100vh/);
  assert.match(css, /\.belt-toolbar__inner\)[\s\S]*display:\s*flex/);
  assert.match(css, /\.belt-toolbar__inner\)[\s\S]*inline-size:\s*max-content/);
});

it("bases menu select and combobox item hover states on root elevation", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.match(
    css,
    /\.belt-combobox\[data-elevation="2"\][\s\S]*--belt-surface-hover:\s*var\(--belt-color-elevation-2-hover\)/,
  );
  assert.match(
    css,
    /\.belt-combobox\[data-elevation="3"\][\s\S]*--belt-surface-hover:\s*var\(--belt-color-elevation-3-hover\)/,
  );
  assert.match(
    css,
    /\.belt-menu__item\[data-highlighted="true"\][\s\S]*\.belt-select__item\[data-highlighted="true"\][\s\S]*\.belt-combobox__item\[data-highlighted="true"\][\s\S]*background-color:\s*var\(--belt-surface-hover\)/,
  );
  assert.notMatch(
    css,
    /\.belt-combobox__item\[data-highlighted="true"\][\s\S]*background-color:\s*var\(--belt-color-elevation-3-hover\)/,
  );
});

it("does not widen the locked token contract", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.ok(!/--belt-color-foreground:/.test(css));
  assert.ok(!/--belt-color-foreground-subtle:/.test(css));
  assert.ok(!/--belt-color-foreground-strong:/.test(css));
  assert.ok(!/--belt-color-[a-z]+-control/.test(css));
  assert.ok(!/--belt-space-\d+:/.test(css));
});

it("uses short data attributes for component variants", async () => {
  const css = await readFile(themeCssPath, "utf8");

  for (const attribute of [
    "data-tone",
    "data-emphasis",
    "data-elevation",
    "data-radius",
    "data-size",
    "data-gap",
  ]) {
    assert.match(css, new RegExp(`\\[${attribute}`));
  }

  assert.ok(!/data-belt-surface/.test(css));
  assert.ok(!/\.belt-text\[data-tone="(?:subtle|strong|foreground)"\]/.test(css));
  assert.ok(!/\.belt-icon\[data-tone="(?:subtle|strong|foreground)"\]/.test(css));
  assert.match(css, /\.belt-text\[data-emphasis="subtle"\]/);
  assert.match(css, /\.belt-text\[data-emphasis="strong"\]/);
  assert.match(css, /\.belt-icon\[data-emphasis="subtle"\]/);
  assert.match(css, /\.belt-icon\[data-emphasis="strong"\]/);
});

it("keeps color tokens in oklch-compatible syntax", async () => {
  const css = await readFile(themeCssPath, "utf8");
  const colorDeclarations = [...css.matchAll(/^\s*(--belt-color-[^:]+):\s*([^;]+);/gm)];

  assert.ok(colorDeclarations.length > 0);

  for (const [, name, value] of colorDeclarations) {
    const trimmed = value.trim();

    assert.ok(
      trimmed.startsWith("oklch(") ||
        trimmed.startsWith("color-mix(in oklch,") ||
        trimmed.startsWith("light-dark(") ||
        trimmed.startsWith("var(--"),
      `${name} must use oklch-compatible syntax, received ${trimmed}`,
    );
    assert.ok(!/#[0-9a-f]/i.test(trimmed), `${name} must not use hex colors`);
    assert.ok(!/\brgba?\(/i.test(trimmed), `${name} must not use rgb colors`);
  }
});

it("keeps raw color palettes on a 14-step scale", async () => {
  const css = await readFile(themeCssPath, "utf8");
  const rawColorDeclarations = [...css.matchAll(/^\s*--([a-z]+)-(\d+):\s*oklch\(([^)]*)\);/gm)];
  const palettes = new Map<string, Set<number>>();

  for (const [, name, index] of rawColorDeclarations) {
    const indexes = palettes.get(name) ?? new Set<number>();
    indexes.add(Number(index));
    palettes.set(name, indexes);
  }

  assert.ok(palettes.size > 0);

  for (const [name, indexes] of palettes) {
    assert.deepEqual(
      [...indexes].sort((a, b) => a - b),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      `${name} must expose 14 steps`,
    );
  }
});

it("leaves deferred token families out of the v1 contract", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.ok(!/--belt-color-background:/.test(css));
  assert.ok(!/--belt-color-surface:/.test(css));
  assert.ok(!/--belt-color-selected:/.test(css));
  assert.ok(!/--belt-shadow/.test(css));
});

it("defines built-in dark mode through color-scheme and light-dark tokens", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.match(css, /color-scheme:\s*light dark/);
  assert.match(css, /\[data-belt-theme="belt-light"\]\s*\{\s*color-scheme:\s*light;/);
  assert.match(css, /\[data-belt-theme="belt-dark"\]\s*\{\s*color-scheme:\s*dark;/);
  assert.match(css, /--belt-color-elevation-1:\s*light-dark\(/);
  assert.ok(!/@media\s*\(prefers-color-scheme:\s*dark\)/.test(css));
});

it("exports portable surface classes with attribute selector variants", async () => {
  const css = await readFile(themeCssPath, "utf8");

  for (const selector of [
    ".belt-surface",
    ".belt-surface__inner",
    '[data-elevation="3"]',
    '[data-radius="outer"]',
    '[data-placement="absolute"]',
  ]) {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(css, /::before/);
  assert.match(css, /::after/);
  assert.match(css, /:has\(> \.belt-surface__inner > \[data-control\]:focus-visible\)/);
  assert.match(css, /:has\(> \.belt-surface__inner > \.belt-input:focus-visible\)/);
  assert.ok(
    !/data-belt-surface/.test(css),
    "surface CSS should use short data attributes for component variants",
  );
  assert.ok(
    !/&::?/.test(css),
    "surface CSS should be emitted as plain selectors instead of nested mixin syntax",
  );
});

it("defines inherited container and child radius contexts", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.match(css, /--belt-container-radius:\s*var\(--belt-radius\)/);
  assert.match(css, /--belt-child-radius:\s*var\(--belt-radius\)/);
  assert.match(
    css,
    /\[data-radius="inner"\][\s\S]*--belt-container-radius:\s*var\(--belt-radius-inner\)[\s\S]*--belt-child-radius:\s*var\(--belt-radius-inner\)/,
  );
  assert.match(
    css,
    /\[data-radius="default"\][\s\S]*--belt-container-radius:\s*var\(--belt-radius\)[\s\S]*--belt-child-radius:\s*var\(--belt-radius-inner\)/,
  );
  assert.match(
    css,
    /\[data-radius="outer"\][\s\S]*--belt-container-radius:\s*var\(--belt-radius-outer\)[\s\S]*--belt-child-radius:\s*var\(--belt-radius\)/,
  );
  assert.match(
    css,
    /:where\(\.belt-surface\)[\s\S]*--belt-surface-radius:\s*calc\(var\(--belt-child-radius,\s*var\(--belt-radius\)\)\s*\+\s*1px\)/,
  );
  assert.match(
    css,
    /:where\(\.belt-surface\[data-radius="inner"\][\s\S]*--belt-surface-radius:\s*var\(--belt-container-radius\)/,
  );
  assert.match(
    css,
    /:where\(\.belt-button\)[\s\S]*border-radius:\s*var\(--belt-child-radius,\s*var\(--belt-radius\)\)/,
  );
  assert.match(
    css,
    /:where\(\.belt-ghost-button\)[\s\S]*border-radius:\s*var\(--belt-child-radius,\s*var\(--belt-radius\)\)/,
  );
  assert.match(
    css,
    /:where\(\.belt-input\)[\s\S]*border-radius:\s*var\(--belt-child-radius,\s*var\(--belt-radius\)\)/,
  );
  assert.match(
    css,
    /:where\(\.belt-status-banner\)[\s\S]*border-radius:\s*var\(--belt-container-radius,\s*var\(--belt-radius\)\)/,
  );
});

it("uses matching neutral hover colors for elevated buttons", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.match(css, /--belt-surface-hover:\s*var\(--belt-color-elevation-1-hover\)/);
  assert.match(
    css,
    /\[data-elevation="2"\][\s\S]*--belt-surface-hover:\s*var\(--belt-color-elevation-2-hover\)/,
  );
  assert.match(
    css,
    /\[data-elevation="3"\][\s\S]*--belt-surface-hover:\s*var\(--belt-color-elevation-3-hover\)/,
  );
  assert.match(css, /--belt-button-bg-hover:\s*var\(--belt-surface-hover\)/);
  assert.match(
    css,
    /\.belt-ghost-button\[data-elevation="2"\][\s\S]*--belt-ghost-button-bg-hover:\s*var\(--belt-color-elevation-2-hover\)/,
  );
  assert.match(
    css,
    /\.belt-ghost-button\[data-elevation="3"\][\s\S]*--belt-ghost-button-bg-hover:\s*var\(--belt-color-elevation-3-hover\)/,
  );
});
