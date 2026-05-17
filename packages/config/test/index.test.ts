import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, it } from "@effect/vitest";
import { defineToolbar } from "@repo/core";
import { Effect, Layer } from "effect";
import {
  InvalidToolbarConfigExportError,
  MissingToolbarConfigError,
  ToolbarConfig,
  ToolbarConfigModuleLoadError,
  ToolbarConfigService,
  toolbarConfigFilenames,
  UnsupportedToolbarConfigFormatError
} from "../src/index.ts";

it.effect("discovers config files in the documented order", () =>
  withLive(withTempDir((cwd) =>
    Effect.gen(function*() {
      yield* writeTempFile(cwd, "toolbar.config.js", "export default { tools: [] };\n");
      yield* writeTempFile(cwd, "toolbar.config.mjs", "export default { tools: [] };\n");
      const configService = yield* ToolbarConfigService;

      const found = yield* configService.find({ cwd });

      assert.strictEqual(found, path.join(cwd, "toolbar.config.js"));
      assert.strictEqual(toolbarConfigFilenames[0], "toolbar.config.ts");
    })
  )));

it.effect("loads a valid module config through the Effect service", () =>
  withLive(withTempDir((cwd) =>
    Effect.gen(function*() {
      yield* writeTempFile(
        cwd,
        "toolbar.config.mjs",
        "export default { tools: [{ id: 'worktrees', label: 'Worktrees' }] };\n"
      );
      const configService = yield* ToolbarConfigService;

      const config = yield* configService.load({ cwd });

      assert.deepStrictEqual(config.tools, [{ id: "worktrees", label: "Worktrees" }]);
    })
  )));

it.effect("fails with MissingToolbarConfigError when no config exists", () =>
  withLive(withTempDir((cwd) =>
    Effect.gen(function*() {
      const configService = yield* ToolbarConfigService;
      const message = yield* Effect.catchTag(
        configService.load({ cwd }),
        "MissingToolbarConfigError",
        (error) => Effect.succeed(error instanceof MissingToolbarConfigError ? error.cwd : "wrong")
      );

      assert.strictEqual(message, cwd);
    })
  )));

it.effect("fails with InvalidToolbarConfigExportError when the default export is not a toolbar config", () =>
  withLive(withTempDir((cwd) =>
    Effect.gen(function*() {
      yield* writeTempFile(cwd, "toolbar.config.mjs", "export default { nope: true };\n");
      const configService = yield* ToolbarConfigService;

      const tag = yield* Effect.catchTag(
        configService.load({ cwd }),
        "InvalidToolbarConfigExportError",
        (error) => Effect.succeed(error instanceof InvalidToolbarConfigExportError ? error._tag : "wrong")
      );

      assert.strictEqual(tag, "InvalidToolbarConfigExportError");
    })
  )));

it.effect("fails with UnsupportedToolbarConfigFormatError for explicit unsupported paths", () =>
  withLive(withTempDir((cwd) =>
    Effect.gen(function*() {
      yield* writeTempFile(cwd, "toolbar.config.json", "{}\n");
      const configService = yield* ToolbarConfigService;

      const tag = yield* Effect.catchTag(
        configService.load({ cwd, path: "toolbar.config.json" }),
        "UnsupportedToolbarConfigFormatError",
        (error) => Effect.succeed(error instanceof UnsupportedToolbarConfigFormatError ? error._tag : "wrong")
      );

      assert.strictEqual(tag, "UnsupportedToolbarConfigFormatError");
    })
  )));

it.effect("fails with ToolbarConfigModuleLoadError when module evaluation fails", () =>
  withLive(withTempDir((cwd) =>
    Effect.gen(function*() {
      yield* writeTempFile(cwd, "toolbar.config.mjs", "throw new Error('boom');\n");
      const configService = yield* ToolbarConfigService;

      const tag = yield* Effect.catchTag(
        configService.load({ cwd }),
        "ToolbarConfigModuleLoadError",
        (error) => Effect.succeed(error instanceof ToolbarConfigModuleLoadError ? error._tag : "wrong")
      );

      assert.strictEqual(tag, "ToolbarConfigModuleLoadError");
    })
  )));

it.effect("can be supplied through a custom ToolbarConfigService layer", () => {
  const TestService = ToolbarConfigService.context({
    find: () => Effect.succeed("/virtual/toolbar.config.ts"),
    load: () => Effect.succeed(defineToolbar({ tools: [] }))
  });

  return Effect.gen(function*() {
    const configService = yield* ToolbarConfigService;
    const found = yield* configService.find();
    const config = yield* configService.load();

    assert.strictEqual(found, "/virtual/toolbar.config.ts");
    assert.deepStrictEqual(config.tools, []);
  }).pipe(Effect.provide(TestService));
});

it.effect("provides a loaded toolbar config as a service layer", () =>
  Effect.gen(function*() {
    const config = yield* ToolbarConfig;

    assert.deepStrictEqual(config.tools, [{ id: "worktrees", label: "Worktrees" }]);
  }).pipe(
    Effect.provide(ToolbarConfig.layer(defineToolbar({
      tools: [{ id: "worktrees", label: "Worktrees" }]
    })))
  ));

function withTempDir<A, E, R>(run: (cwd: string) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R> {
  return Effect.acquireUseRelease(
    Effect.tryPromise(() => mkdtemp(path.join(tmpdir(), "belt-config-"))),
    run,
    (cwd) => Effect.promise(() => rm(cwd, { force: true, recursive: true }))
  );
}

function withLive<A, E, R>(effect: Effect.Effect<A, E, R | ToolbarConfigService>): Effect.Effect<A, E, R> {
  return Effect.provide(effect, Layer.provide(ToolbarConfigService.layer, Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)));
}

function writeTempFile(cwd: string, filename: string, contents: string): Effect.Effect<void> {
  return Effect.promise(() => writeFile(path.join(cwd, filename), contents));
}
