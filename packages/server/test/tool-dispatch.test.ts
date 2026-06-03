import { assert, describe, it } from "@effect/vitest";
import { ToolbarConfig } from "@repo/config";
import { defineToolbar, toolApiRoutePath, normalizeRoute } from "@repo/core";
import { Effect, Layer, Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { ToolbarToolDispatch } from "../src/tool-dispatch.ts";
import { createToolbarServer } from "../src/index.ts";

describe("ToolbarToolDispatch", () => {
  it.effect("returns registered tool metadata through the dispatch interface", () =>
    Effect.gen(function* () {
      const dispatch = yield* ToolbarToolDispatch;
      const tool = yield* dispatch.tool("worktrees");

      assert.deepStrictEqual(tool, {
        id: "worktrees",
        label: "Worktrees",
        routes: ["submit"],
      });
    }).pipe(Effect.provide(testLayer)),
  );

  it.effect("serves tool-owned Effect HTTP APIs under the runtime tool id", () =>
    Effect.gen(function* () {
      const server = createToolbarServer(
        defineToolbar({
          tools: [
            {
              tool: {
                api: EchoToolApi,
                apiLayer: EchoToolApiHandlers,
                id: "echo",
                label: "Echo",
              },
            },
          ],
        }),
      );

      try {
        const response = yield* Effect.promise(() =>
          server.fetch(
            new Request(`http://belt.local${toolApiRoutePath("echo", "submit")}`, {
              method: "POST",
              body: JSON.stringify({ ok: true }),
              headers: {
                "content-type": "application/json",
              },
            }),
          ),
        );

        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(yield* Effect.promise(() => response.json()), {
          method: "POST",
          body: {
            ok: true,
          },
        });
      } finally {
        yield* Effect.promise(() => server.dispose());
      }
    }),
  );

  it.effect("disposes tool-owned Effect HTTP API handler layers", () =>
    Effect.gen(function* () {
      let disposed = false;
      const server = createToolbarServer(
        defineToolbar({
          tools: [
            {
              tool: {
                api: EchoToolApi,
                apiLayer: Layer.mergeAll(
                  EchoToolApiHandlers,
                  Layer.effectDiscard(
                    Effect.addFinalizer(() =>
                      Effect.sync(() => {
                        disposed = true;
                      }),
                    ),
                  ),
                ),
                id: "echo",
                label: "Echo",
              },
            },
          ],
        }),
      );

      const response = yield* Effect.promise(() =>
        server.fetch(
          new Request(`http://belt.local${toolApiRoutePath("echo", "submit")}`, {
            method: "POST",
            body: JSON.stringify({ ok: true }),
            headers: {
              "content-type": "application/json",
            },
          }),
        ),
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(disposed, false);

      yield* Effect.promise(() => server.dispose());

      assert.strictEqual(disposed, true);
    }),
  );
});

const EchoRequestSchema = Schema.Struct({
  ok: Schema.Boolean,
});

const EchoResponseSchema = Schema.Struct({
  method: Schema.String,
  body: EchoRequestSchema,
});

class EchoToolApiGroup extends HttpApiGroup.make("echo").add(
  HttpApiEndpoint.post("submit", normalizeRoute("submit"), {
    payload: EchoRequestSchema,
    success: EchoResponseSchema,
  }),
) {}

class EchoToolApi extends HttpApi.make("echo-tool-api").add(EchoToolApiGroup) {}

const EchoToolApiHandlers = HttpApiBuilder.group(EchoToolApi, "echo", (handlers) =>
  handlers.handle("submit", ({ payload }) =>
    Effect.succeed({
      method: "POST",
      body: payload,
    }),
  ),
);

const testConfig = defineToolbar({
  tools: [
    {
      tool: {
        api: EchoToolApi,
        apiLayer: EchoToolApiHandlers,
        id: "worktrees",
        label: "Worktrees",
      },
    },
  ],
});

const testLayer = Layer.provide(ToolbarToolDispatch.layer, ToolbarConfig.layer(testConfig));
