import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { assert, it } from "@effect/vitest";

const themeCssPath = fileURLToPath(new URL("../src/theme.css", import.meta.url));

it("exports the v1 theme token contract", async () => {
  const css = await readFile(themeCssPath, "utf8");

  for (const token of [
    "--belt-color-elevation-0",
    "--belt-color-elevation-0-hover",
    "--belt-color-elevation-0-active",
    "--belt-color-elevation-0-inset",
    "--belt-color-elevation-2",
    "--belt-color-foreground",
    "--belt-color-foreground-subtle",
    "--belt-color-foreground-strong",
    "--belt-color-border",
    "--belt-color-border-subtle",
    "--belt-color-border-strong",
    "--belt-color-focus",
    "--belt-color-danger-control",
    "--belt-space",
    "--belt-space-12",
    "--belt-radius-inner",
    "--belt-radius",
    "--belt-radius-outer",
    "--belt-font-family",
    "--belt-font-feature-settings",
    "--belt-font-variant-alternates",
    "--belt-font-variant-ligatures",
    "--belt-font-variant-numeric"
  ]) {
    assert.match(css, new RegExp(`${token}:`));
  }
});

it("sets the default font family and OpenType feature contract", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.match(css, /--belt-font-family:\s*"Inter"/);

  for (const feature of ["calt", "dlig", "case", "ccmp", "zero", "ss01", "ss02", "ss07", "ss08", "cv06", "cv11"]) {
    assert.match(css, new RegExp(`"${feature}" 1`));
  }

  assert.match(css, /--belt-font-variant-ligatures:\s*common-ligatures discretionary-ligatures contextual/);
  assert.match(css, /--belt-font-variant-numeric:\s*slashed-zero/);
  assert.match(css, /--belt-font-variant-alternates:.*styleset\(ss01\).*character-variant\(cv11\)/);
});

it("keeps color tokens in oklch-compatible syntax", async () => {
  const css = await readFile(themeCssPath, "utf8");
  const colorDeclarations = [...css.matchAll(/^\s*(--belt-color-[^:]+):\s*([^;]+);/gm)];

  assert.ok(colorDeclarations.length > 0);

  for (const [, name, value] of colorDeclarations) {
    const trimmed = value.trim();

    assert.ok(
      trimmed.startsWith("oklch(") || trimmed.startsWith("color-mix(in oklch,") || trimmed.startsWith("var(--"),
      `${name} must use oklch-compatible syntax, received ${trimmed}`
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
    assert.deepEqual([...indexes].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], `${name} must expose 14 steps`);
  }
});

it("leaves deferred token families out of the v1 contract", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.ok(!/--belt-color-background:/.test(css));
  assert.ok(!/--belt-color-surface:/.test(css));
  assert.ok(!/--belt-color-selected:/.test(css));
  assert.ok(!/--belt-shadow/.test(css));
});
