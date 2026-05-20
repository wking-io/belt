import { Context, Effect, Layer, Random, Schema } from "effect";

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

export type IdGeneratorService = {
  readonly next: (prefix?: string) => Effect.Effect<string>;
};

export class IdGenerator extends Context.Service<IdGenerator, IdGeneratorService>()("belt/IdGenerator") {
  static readonly layer = Layer.succeed(IdGenerator)({
    next: Effect.fn("IdGenerator.next")(function*(prefix?: string) {
      const id = yield* Random.nextUUIDv4;

      return prefix ? `${prefix}_${id}` : id;
    })
  });
}
