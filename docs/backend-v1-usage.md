# Backend v1 Usage

Backend v1 covers the server-side Toolbar API, explicit Tool Registration, framework mounting, and the Iterations backend. It does not include frontend renderers or process management.

## Toolbar Config

Create a `toolbar.config.ts` module at the host app root:

```ts
import { defineToolbar } from "@riff-refine/belt";
import { iterationsTool } from "@riff-refine/belt/iterations";
import { prototypeIterations } from "@riff-refine/belt/iterations/prototypes";
import { worktreeIterations } from "@riff-refine/belt/iterations/worktrees";
import { portlessResolver } from "@riff-refine/belt/iterations/worktrees/portless";

export default defineToolbar({
  tools: [
    iterationsTool({
      providers: [
        worktreeIterations({
          resolver: portlessResolver({
            destinations: [
              {
                id: "web",
                label: "Web",
                appName: "myapp"
              }
            ]
          })
        }),
        prototypeIterations()
      ]
    })
  ]
});
```

Tool Registration is explicit. Installing a Tool package does not make it available; the app must add it to `tools`.

Config discovery can also load a Toolbar Definition produced by a renderer package's `createToolbar`. The backend extracts the same Tool Registration from the definition, so one export can be used by application rendering and backend setup:

```ts
import { createToolbar } from "@riff-refine/belt/react";
import { iterationsTool } from "@riff-refine/belt/iterations";
import { worktreeIterations } from "@riff-refine/belt/iterations/worktrees";
import { portlessResolver } from "@riff-refine/belt/iterations/worktrees/portless";

export default createToolbar({
  tools: [
    iterationsTool({
      providers: [
        worktreeIterations({
          resolver: portlessResolver({
            destinations: [
              {
                id: "web",
                label: "Web",
                appName: "myapp"
              }
            ]
          })
        })
      ]
    })
  ]
});
```

The config package can discover conventional module config files:

```txt
toolbar.config.ts
toolbar.config.mts
toolbar.config.js
toolbar.config.mjs
```

## Toolbar API

All backend adapters expose the Toolbar API under `/__toolbar`:

```txt
GET /__toolbar
GET /__toolbar/tools
GET /__toolbar/tools/:toolId
GET /__toolbar/tools/:toolId/*
```

Core Toolbar protocol responses use:

```json
{
  "ok": true,
  "data": {}
}
```

Error responses use:

```json
{
  "ok": false,
  "error": {
    "code": "UNKNOWN_TOOL",
    "message": "Unknown tool"
  }
}
```

`@riff-refine/belt` owns the protocol schemas, route constants, path builders, and the shared Effect HTTP `ToolbarApi` definition. `@riff-refine/belt/server` implements that protocol as a JavaScript Fetch server using Effect HTTP.

Tool packages define their own mounted Effect HTTP APIs under `/__toolbar/tools/:toolId/*`. Tool route responses follow the tool-owned `HttpApi` contract rather than the core Toolbar `ok/data` envelope.

The public Belt server entrypoint uses Tool-declared default runtime layers for built-in tools. Host apps register tools in config; they do not need to manually provide built-in tool layers such as the Control Panel snapshot store.

Tests and custom hosts can replace a built-in Tool runtime by registering a fully wired Tool definition. In that case, provide the Tool's `apiLayer` with the custom services and omit the Tool's default `runtimeLayer` before passing the config to `createToolbarServer`.

## Direct Fetch Server

Use `@riff-refine/belt/server` directly when the host already works with standard `Request` and `Response` objects:

```ts
import { createToolbarServer } from "@riff-refine/belt/server";
import toolbarConfig from "./toolbar.config";

const toolbarServer = createToolbarServer(toolbarConfig);

const response = await toolbarServer.fetch(
  new Request("http://local.test/__toolbar")
);

await toolbarServer.dispose();
```

## Remix Mounting

Remix apps mount the Toolbar API explicitly from app routes.

Create a shared route handler:

```ts
// app/toolbar.server.ts
import { createToolbarRouteHandler } from "@riff-refine/belt/remix";
import toolbarConfig from "../toolbar.config";

export const toolbarRouteHandler = createToolbarRouteHandler(toolbarConfig);
```

Mount it from a route that owns `/__toolbar/*`:

```ts
// app/routes/__toolbar.$.ts
import { toolbarRouteHandler } from "~/toolbar.server";

export const loader = toolbarRouteHandler;
export const action = toolbarRouteHandler;
```

The same handler can serve loader and action requests because the Toolbar Server receives the original Fetch `Request` and handles the method.

## Vite Mounting

Vite apps install the middleware adapter:

```ts
// vite.config.ts
import { toolbarVite } from "@riff-refine/belt/vite";
import { defineConfig } from "vite";
import toolbarConfig from "./toolbar.config";

export default defineConfig({
  plugins: [
    toolbarVite(toolbarConfig)
  ]
});
```

The adapter mounts `/__toolbar` by default, translates Node middleware requests into Fetch requests, and sends Fetch responses back through Vite middleware responses.

## Iterations Backend

`@riff-refine/belt/iterations` registers the `iterations` Tool. Its backend route is:

```txt
GET /__toolbar/tools/iterations
```

The Tool asks configured Iteration Providers for app variants and returns one list of iterations. Git worktrees and prototype overlays are providers of the same user-facing capability.

An iteration has a stable id, display label, kind, current marker, and one or more destinations. Provider-specific data, such as Git branch/path metadata or prototype source directory metadata, lives under metadata.

The Iterations Tool does not start, stop, install dependencies for, or supervise development servers. It only reports iterations and destinations for app variants that already exist.

## Worktree Iteration Provider

`@riff-refine/belt/iterations/worktrees` discovers linked Git worktrees for the Iterations Tool. It marks the current worktree and asks a URL Resolver Extension for navigable destinations.

Legacy `@riff-refine/belt/worktrees` imports are kept for migration, but new configuration should use the Iterations Tool.

## Portless Extension

`@riff-refine/belt/iterations/worktrees/portless` is a Worktree Iteration Provider URL Resolver Extension. It converts each discovered worktree into one or more Portless-style destinations:

```ts
portlessResolver({
  destinations: [
    {
      id: "web",
      label: "Web",
      appName: "myapp",
      primary: true
    },
    {
      id: "docs",
      label: "Docs",
      appName: "docs.myapp"
    }
  ]
});
```

For a branch named `fix-ui`, those destinations resolve to URLs like:

```txt
https://fix-ui.myapp.localhost
https://fix-ui.docs.myapp.localhost
```

Main branches default to unprefixed hostnames:

```txt
https://myapp.localhost
```

## Prototype Iteration Provider

`@riff-refine/belt/iterations/prototypes` discovers prototype folders and exposes them as prototype iterations with preview destinations under `/__prototype/:name` by default.

Prototype overlay runtime behavior for Vite lives in `@riff-refine/belt/iterations/prototypes/vite`. It injects prototype routes, virtual module identity, and module graph overlay behavior. That adapter is separate from the generic Vite Adapter that mounts the Toolbar API.

Pair the provider and adapter when using Vite:

```ts
// vite.config.ts
import { toolbarVite } from "@riff-refine/belt/vite";
import { prototypeIterationsVite } from "@riff-refine/belt/iterations/prototypes/vite";
import { defineConfig } from "vite";
import toolbarConfig from "./toolbar.config";

export default defineConfig({
  plugins: [
    toolbarVite(toolbarConfig),
    prototypeIterationsVite()
  ]
});
```

## Non-Goals

Backend v1 intentionally does not include:

- frontend Toolbar Wrapper rendering
- frontend Tool renderers
- React or Remix component APIs for the UI surface
- process management
- automatic Tool discovery from installed packages
- starting inactive worktree dev servers
