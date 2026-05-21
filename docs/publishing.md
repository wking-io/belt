# Publishing

The npm product package is `@riff-refine/belt`.

Internal workspace packages stay private `@repo/*` implementation packages. Do not publish them.

To prepare the npm package:

```sh
pnpm pack:belt
```

This builds the workspace and stages a publishable package at:

```txt
packages/belt/npm
```

The staged package:

- exposes `@riff-refine/belt` and framework/tool subpaths
- copies compiled internal workspace package output into `_internal`
- rewrites internal `@repo/*` imports to relative `_internal` imports
- declares only external runtime dependencies in its staged `package.json`

Inspect the staged package before publishing:

```sh
cd packages/belt/npm
npm pack --dry-run
```

Publish from `packages/belt/npm`, not from `packages/belt`.
