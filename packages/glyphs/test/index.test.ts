import { assert, it } from "@effect/vitest";
import { glyphDefinitions, glyphIds, glyphNames, type GlyphName } from "../src/index.ts";

it("defines a complete stable glyph contract", () => {
  assert.deepStrictEqual(Object.keys(glyphDefinitions), [...glyphNames]);

  for (const name of glyphNames) {
    assert.strictEqual(glyphIds[name], `rmx-glyph-${name}`);
    assert.ok(glyphDefinitions[name].children.length > 0);
  }
});

it("keeps glyph names typed", () => {
  const name: GlyphName = "copy";

  assert.strictEqual(name, "copy");

  // @ts-expect-error unknown glyph names should be rejected
  const invalidName: GlyphName = "unknown";

  assert.strictEqual(invalidName, "unknown");
});
