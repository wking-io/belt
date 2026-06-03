# Vite Adapter

`@riff-refine/belt/vite` mounts the Toolbar API into Vite's development middleware stack.

The adapter builds on the JavaScript Fetch Toolbar Server from `@riff-refine/belt/server`, so Vite only owns the Node request/response translation layer.

```ts
// vite.config.ts
import { toolbarVite } from "@riff-refine/belt/vite";
import { defineConfig } from "vite";
import toolbarConfig from "./toolbar.config";

export default defineConfig({
  plugins: [toolbarVite(toolbarConfig)],
});
```

`toolbarVite` accepts either a plain Toolbar Config from `defineToolbar` or a Toolbar Definition from a renderer package's `createToolbar`.

The Toolbar API is mounted at `/__toolbar` by default:

```txt
GET /__toolbar
GET /__toolbar/tools
GET /__toolbar/tools/:toolId
GET /__toolbar/tools/:toolId/*
```

Vite strips the mounted prefix before calling middleware handlers. The adapter restores the `/__toolbar` prefix before sending the request through `@riff-refine/belt/server`, so Toolbar Server behavior matches other framework adapters.

You can override the mount path if an app needs a different explicit route:

```ts
toolbarVite(toolbarConfig, {
  mountPath: "/internal/toolbar",
});
```

## Prototype Iterations

Prototype overlays use a separate Vite adapter because they change the app module graph. Pair the backend Prototype Iteration Provider with the Vite prototype adapter:

```ts
// toolbar.config.ts
import { defineToolbar } from "@riff-refine/belt";
import { iterationsTool } from "@riff-refine/belt/iterations";
import { prototypeIterations } from "@riff-refine/belt/iterations/prototypes";

export default defineToolbar({
  tools: [
    iterationsTool({
      providers: [prototypeIterations()],
    }),
  ],
});
```

```ts
// vite.config.ts
import { toolbarVite } from "@riff-refine/belt/vite";
import { prototypeIterationsVite } from "@riff-refine/belt/iterations/prototypes/vite";
import { defineConfig } from "vite";
import toolbarConfig from "./toolbar.config";

export default defineConfig({
  plugins: [toolbarVite(toolbarConfig), prototypeIterationsVite()],
});
```

By default, the provider discovers folders under `prototypes/` and exposes destinations under `/__prototype/:name`. The Vite adapter serves those routes by injecting a prototype-specific app entry and resolving app-local imports through sparse prototype overlays.

If the app entry is not `/src/main.tsx`, pass the same entry path to the adapter:

```ts
prototypeIterationsVite({
  appEntry: "/src/main.ts",
});
```

For production prototype gallery builds, pass `buildPrototype` to build one prototype graph at a time:

```ts
prototypeIterationsVite({
  buildPrototype: "pricing-test",
});
```
