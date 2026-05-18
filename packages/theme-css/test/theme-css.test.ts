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
    "--belt-color-elevation-3",
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
    "--belt-radius-outer"
  ]) {
    assert.match(css, new RegExp(`${token}:`));
  }
});

it("keeps color tokens in oklch color syntax", async () => {
  const css = await readFile(themeCssPath, "utf8");
  const colorDeclarations = [...css.matchAll(/(--belt-color-[^:]+):\s*([^;]+);/g)];

  assert.ok(colorDeclarations.length > 0);

  for (const [, name, value] of colorDeclarations) {
    const trimmed = value.trim();

    assert.ok(
      trimmed.startsWith("oklch(") || trimmed.startsWith("color-mix(in oklch,"),
      `${name} must use oklch syntax, received ${trimmed}`
    );
    assert.ok(!/#[0-9a-f]/i.test(trimmed), `${name} must not use hex colors`);
    assert.ok(!/\brgba?\(/i.test(trimmed), `${name} must not use rgb colors`);
  }
});

it("leaves deferred token families out of the v1 contract", async () => {
  const css = await readFile(themeCssPath, "utf8");

  assert.ok(!/--belt-color-background:/.test(css));
  assert.ok(!/--belt-color-surface:/.test(css));
  assert.ok(!/--belt-color-selected:/.test(css));
  assert.ok(!/--belt-shadow/.test(css));
});
