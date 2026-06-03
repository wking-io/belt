import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { Effect } from "effect";
import {
  discoverPrototypes,
  getPrototypeMetadata,
  listPrototypeIterations
} from "../src/index.ts";

describe("discoverPrototypes", () => {
  it.effect("discovers prototype directories with default first", () =>
    Effect.gen(function*() {
      const root = yield* Effect.promise(() => makePrototypeFixture());

      try {
        const prototypes = yield* discoverPrototypes({
          prototypesDir: join(root, "prototypes"),
          includeDefault: true
        }).pipe(
          Effect.provide(NodeFileSystem.layer),
          Effect.provide(NodePath.layer)
        );

        assert.deepStrictEqual(prototypes, ["default", "onboarding-v2", "pricing-test"]);
      } finally {
        yield* Effect.promise(() => rm(root, { force: true, recursive: true }));
      }
    }));
});

describe("prototype metadata", () => {
  it.effect("maps prototype folders into prototype iterations", () =>
    Effect.gen(function*() {
      const root = yield* Effect.promise(() => makePrototypeFixture());

      try {
        const metadata = yield* getPrototypeMetadata({ root }).pipe(
          Effect.provide(NodeFileSystem.layer),
          Effect.provide(NodePath.layer)
        );
        const iterations = yield* listPrototypeIterations({ root }).pipe(
          Effect.provide(NodeFileSystem.layer),
          Effect.provide(NodePath.layer)
        );

        assert.strictEqual(metadata.routePrefix, "/__prototype/");
        assert.deepStrictEqual(iterations.map((iteration) => ({
          id: iteration.id,
          kind: iteration.kind,
          url: iteration.destinations[0]?.url
        })), [
          {
            id: "prototype:default",
            kind: "prototype",
            url: "/__prototype/default"
          },
          {
            id: "prototype:onboarding-v2",
            kind: "prototype",
            url: "/__prototype/onboarding-v2"
          },
          {
            id: "prototype:pricing-test",
            kind: "prototype",
            url: "/__prototype/pricing-test"
          }
        ]);
      } finally {
        yield* Effect.promise(() => rm(root, { force: true, recursive: true }));
      }
    }));
});

async function makePrototypeFixture() {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "belt-prototypes-"));

  await mkdir(join(fixtureRoot, "prototypes", "pricing-test"), { recursive: true });
  await mkdir(join(fixtureRoot, "prototypes", "onboarding-v2"), { recursive: true });

  return fixtureRoot;
}
