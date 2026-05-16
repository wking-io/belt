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
  static readonly Live = Layer.succeed(BackendPattern)({
    greet: (input) =>
      input.name.trim().length === 0
        ? Effect.fail(new BackendPatternError({ message: "name is required" }))
        : Effect.succeed(`hello ${input.name}`)
  });
}
