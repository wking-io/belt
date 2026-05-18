import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import {
  defineTheme,
  defineToolbar,
  defineTool,
  DuplicateToolbarToolIdError,
  ToolbarThemeConfigSchema,
  ToolbarThemeSchema,
  ToolDefinitionSchema,
  ToolbarToolSchema,
  toToolbarToolMetadata,
  validateToolbarConfig,
  type ToolDefinition
} from "../src/index.ts";

it.effect("validates explicit tool registration", () =>
  Effect.gen(function*() {
    const config = yield* validateToolbarConfig({
      tools: [
        {
          id: "worktrees",
          label: "Worktrees",
          routes: {
            index: () => Effect.succeed({ worktrees: [] })
          }
        }
      ]
    });

    assert.strictEqual(config.tools[0]?.id, "worktrees");
  }));

it.effect("validates toolbar theme config in string and object forms", () =>
  Effect.gen(function*() {
    const stringConfig = yield* Schema.decodeUnknownEffect(ToolbarThemeConfigSchema)("system");
    const objectConfig = yield* Schema.decodeUnknownEffect(ToolbarThemeConfigSchema)({
      default: "my-dark",
      themes: [
        defineTheme({
          id: "my-dark",
          name: "My Dark",
          mode: "dark",
          extends: "belt-dark",
          variables: {
            "--belt-color-elevation-0": "oklch(20% 0.01 260)"
          }
        })
      ]
    });

    assert.strictEqual(stringConfig, "system");
    assert.strictEqual(typeof objectConfig, "object");
    assert.strictEqual(objectConfig.themes?.[0]?.id, "my-dark");
  }));

it.effect("validates theme definitions with belt-prefixed CSS variables", () =>
  Effect.gen(function*() {
    const theme = yield* Schema.decodeUnknownEffect(ToolbarThemeSchema)({
      id: "my-light",
      name: "My Light",
      mode: "light",
      variables: {
        "--belt-color-primary": "oklch(62% 0.2 260)",
        "--belt-radius": "6px"
      }
    });

    assert.strictEqual(theme.mode, "light");
    assert.strictEqual(theme.variables["--belt-radius"], "6px");
  }));

it.effect("validates toolbar tool data with the source-of-truth schema", () =>
  Effect.gen(function*() {
    const tool = yield* Schema.decodeUnknownEffect(ToolbarToolSchema)({
      id: "worktrees",
      label: "Worktrees"
    });

    assert.deepStrictEqual(tool, {
      id: "worktrees",
      label: "Worktrees"
    });
  }));

it.effect("validates tool definitions with schema-backed reference fields", () =>
  Effect.gen(function*() {
    const tool = yield* Schema.decodeUnknownEffect(ToolDefinitionSchema)({
      id: "worktrees",
      label: "Worktrees",
      routes: {
        index: () => Effect.succeed({ worktrees: [] })
      }
    });

    assert.strictEqual(tool.id, "worktrees");
    assert.strictEqual(typeof tool.routes?.index, "function");
  }));

it("throws from defineTool for invalid tool definitions", () => {
  assert.throws(() =>
    defineTool({
      id: "",
      label: "Worktrees"
    })
  );
});

it("throws from defineTheme for non-belt CSS variables", () => {
  assert.throws(() =>
    defineTheme({
      id: "bad-theme",
      name: "Bad Theme",
      mode: "dark",
      variables: {
        "--primary": "oklch(62% 0.2 260)"
      }
    })
  );
});

it.effect("fails validation for duplicate tool ids with a typed error", () =>
  Effect.gen(function*() {
    const duplicateId = yield* Effect.catchTag(
      validateToolbarConfig({
        tools: [
          { id: "worktrees", label: "Worktrees" },
          { id: "worktrees", label: "Worktrees again" }
        ]
      }),
      "DuplicateToolbarToolIdError",
      (error) => Effect.succeed(error.id)
    );

    assert.strictEqual(duplicateId, "worktrees");
  }));

it("throws a typed error from defineToolbar for invalid module config registration", () => {
  assert.throws(
    () =>
      defineToolbar({
        tools: [
          { id: "worktrees", label: "Worktrees" },
          { id: "worktrees", label: "Worktrees again" }
        ]
      }),
    DuplicateToolbarToolIdError
  );
});

it("preserves configured theme registration from defineToolbar", () => {
  const config = defineToolbar({
    theme: {
      default: "my-dark",
      themes: [
        defineTheme({
          id: "my-dark",
          name: "My Dark",
          mode: "dark",
          extends: "belt-dark",
          variables: {
            "--belt-color-elevation-0": "oklch(20% 0.01 260)"
          }
        })
      ]
    },
    tools: []
  });

  assert.deepStrictEqual(config.theme, {
    default: "my-dark",
    themes: [
      {
        id: "my-dark",
        name: "My Dark",
        mode: "dark",
        extends: "belt-dark",
        variables: {
          "--belt-color-elevation-0": "oklch(20% 0.01 260)"
        }
      }
    ]
  });
});

it("derives tool metadata from route contributions", () => {
  const tool: ToolDefinition = {
    id: "worktrees",
    label: "Worktrees",
    routes: {
      "destinations/check": () => Effect.succeed({ ok: true }),
      index: () => Effect.succeed({ worktrees: [] })
    }
  };

  assert.deepStrictEqual(toToolbarToolMetadata(tool), {
    id: "worktrees",
    label: "Worktrees",
    routes: ["destinations/check", "index"]
  });
});
