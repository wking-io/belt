# Agent Instructions

## Effect Patterns

Follow the Effect service conventions in [docs/effect-service-patterns.md](docs/effect-service-patterns.md).

In particular: do not create helper functions just to use a service. Yield the service at the call site and call methods directly on that service, so Effect requirements and layer dependencies stay visible.

## Adapter Boundaries

Keep the JavaScript Fetch implementation in `@repo/server`. Framework adapters, such as `@repo/adapter-remix` and `@repo/adapter-vite`, should build no-brainer framework-shaped APIs on top of `@repo/server`. Shared cross-language behavior belongs in the `@repo/core` Toolbar API protocol model, not in a Fetch adapter.
