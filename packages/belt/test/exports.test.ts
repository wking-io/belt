import { assert, describe, it } from "@effect/vitest";
import { defineToolbar } from "@riff-refine/belt";
import { createToolbarRouteHandler } from "@riff-refine/belt/remix";
import { createToolbarRendererModel } from "@riff-refine/belt/react";
import { createToolbarServer } from "@riff-refine/belt/server";
import { toolbarVite } from "@riff-refine/belt/vite";
import { worktreesTool } from "@riff-refine/belt/worktrees";
import { portlessResolver } from "@riff-refine/belt/worktrees/portless";

describe("@riff-refine/belt facade exports", () => {
  it("resolves the public package subpaths", () => {
    const config = defineToolbar({ tools: [] });

    assert.deepStrictEqual(createToolbarRendererModel(config), { tools: [] });
    assert.strictEqual(typeof createToolbarRouteHandler, "function");
    assert.strictEqual(typeof createToolbarServer, "function");
    assert.strictEqual(typeof toolbarVite, "function");
    assert.strictEqual(typeof worktreesTool, "function");
    assert.strictEqual(typeof portlessResolver, "function");
  });
});
