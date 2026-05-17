import { Context, Effect, Layer, Schema } from "effect";

export class BackendPatternError extends Schema.TaggedErrorClass<BackendPatternError>()("BackendPatternError", {
  message: Schema.String
}) {}

export const BackendPatternInputSchema = Schema.Struct({
  name: Schema.String
});

export type BackendPatternInput = Schema.Schema.Type<typeof BackendPatternInputSchema>;

export type BackendPatternService = {
  readonly greet: (input: BackendPatternInput) => Effect.Effect<string, BackendPatternError>;
};

export class BackendPattern extends Context.Service<BackendPattern, BackendPatternService>()("belt/BackendPattern") {
  static readonly layer = Layer.succeed(BackendPattern)({
    greet: Effect.fn("BackendPattern.greet")(function*(input) {
      if (input.name.trim().length === 0) {
        return yield* new BackendPatternError({ message: "name is required" });
      }

      return `hello ${input.name}`;
    })
  });
}
