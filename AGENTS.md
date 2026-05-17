# Agent Instructions

## Effect Patterns

Follow the Effect service conventions in [docs/effect-service-patterns.md](docs/effect-service-patterns.md).

In particular: do not create helper functions just to use a service. Yield the service at the call site and call methods directly on that service, so Effect requirements and layer dependencies stay visible.

## Adapter Boundaries

Keep generic Fetch integration in `@repo/adapter-fetch`. Framework adapters, such as `@repo/adapter-remix`, should build no-brainer framework-shaped APIs on top of that package instead of reaching directly into `@repo/server` unless lower-level composition is required.
