# Backend Effect Pattern

Belt backend packages use Effect v4. While Effect v4 is published under the `beta` npm dist-tag, packages pin the exact beta version so backend work does not accidentally drift back to Effect v3.

Use Effect in backend packages for:

- **Services** with `Context.Service`
- **Layers** with `Layer.succeed`, `Layer.effect`, or scoped layers when resources are introduced
- **Typed errors** with `Schema.TaggedErrorClass`
- **Validation schemas** with `Schema.Struct` and related Schema constructors
- **Tests** with `@effect/vitest`

The baseline example lives in `@repo/core`:

- `BackendPattern` demonstrates the service and layer shape
- `BackendPatternError` demonstrates tagged recoverable failures
- `BackendPatternInputSchema` demonstrates schema-backed input validation

Backend packages should return `Effect` values at domain and infrastructure boundaries. Adapters may still expose host-native functions, such as Fetch handlers or Vite middleware, but should run Effect programs at those outer edges.
