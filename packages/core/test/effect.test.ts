import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { BackendPattern, BackendPatternInputSchema } from "../src/index.ts";

it.effect("runs the baseline Effect service/layer/schema pattern", () =>
  Effect.provide(
    Effect.gen(function*() {
      const input = yield* Schema.decodeUnknownEffect(BackendPatternInputSchema)({
        name: "Belt"
      });
      const service = yield* BackendPattern;

      assert.strictEqual(yield* service.greet(input), "hello Belt");
    }),
    BackendPattern.layer
  ));

it.effect("uses tagged errors for recoverable backend failures", () =>
  Effect.provide(
    Effect.gen(function*() {
      const service = yield* BackendPattern;
      const message = yield* Effect.catchTag(
        service.greet({ name: "   " }),
        "BackendPatternError",
        (error) => Effect.succeed(error.message)
      );

      assert.strictEqual(message, "name is required");
    }),
    BackendPattern.layer
  ));
