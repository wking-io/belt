# Effect Service Patterns

Effect services should make dependencies visible at the call site.

## Yield Services Where They Are Used

When code needs a service, yield that service inside the Effect method that uses it and call methods directly on the yielded service.

Prefer:

```ts
const list = Effect.fn("WorktreeDiscovery.list")(function* (options) {
  const childProcess = yield* ChildProcessSpawner;
  const path = yield* Path.Path;

  const output = yield* childProcess.string(command);
  const root = path.resolve(options.cwd, output.trim());

  return root;
});
```

Avoid:

```ts
const childProcess = yield * ChildProcessSpawner;

const gitOutput = Effect.fn("gitOutput")(function* (command) {
  return yield* childProcess.string(command);
});

const list = Effect.fn("WorktreeDiscovery.list")(function* (options) {
  const output = yield* gitOutput(command);
  return output;
});
```

The second shape hides the service dependency behind a helper. It makes the method look less dependent than it is, and it makes layer requirements harder to read.

## Helper Function Rule

Do not make helper functions whose main job is to use a service.

Helpers are fine when they are pure, parse data, map errors, or transform already-provided values. They should not close over yielded services or accept service objects only to call methods on them.

Service-backed operations belong on a service method. Inside that method, yield the service dependency and call the method directly.

## Why This Matters

- Effect requirements stay visible in method signatures.
- Layer composition stays honest.
- Tests can replace services at the boundary instead of reaching around helpers.
- Reading an Effect method shows the real dependencies needed to run it.
