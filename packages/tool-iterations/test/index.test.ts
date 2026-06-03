import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { IterationProviderError, iterationsTool, listIterations } from "../src/index.ts";

describe("listIterations", () => {
  it.effect("flattens iterations from configured providers in order", () =>
    Effect.gen(function* () {
      const iterations = yield* listIterations([
        {
          id: "worktrees",
          label: "Git worktrees",
          list: () =>
            Effect.succeed([
              {
                id: "worktree:feature-a",
                label: "feature-a",
                kind: "worktree",
                current: false,
                destinations: [],
              },
            ]),
        },
        {
          id: "prototypes",
          label: "Prototype overlays",
          list: () =>
            Effect.succeed([
              {
                id: "prototype:pricing",
                label: "pricing",
                kind: "prototype",
                current: false,
                destinations: [],
              },
            ]),
        },
      ]);

      assert.deepStrictEqual(
        iterations.map((iteration) => iteration.id),
        ["worktree:feature-a", "prototype:pricing"],
      );
    }),
  );

  it.effect("wraps provider failures with provider identity", () =>
    Effect.gen(function* () {
      const error = yield* listIterations([
        {
          id: "broken",
          label: "Broken",
          list: () => Effect.fail("boom"),
        },
      ]).pipe(Effect.flip);

      assert.ok(error instanceof IterationProviderError);
      assert.strictEqual(error.providerId, "broken");
    }),
  );
});

describe("iterationsTool", () => {
  it("registers the canonical Iterations tool identity", () => {
    const registration = iterationsTool({ providers: [] });

    assert.strictEqual(registration.tool.id, "iterations");
    assert.strictEqual(registration.tool.label, "Iterations");
    assert.ok(registration.tool.api);
    assert.ok(registration.tool.apiLayer);
  });
});
