# Remix Adapter

`@repo/adapter-remix` connects Remix routes to the framework-neutral Toolbar Server through `@repo/adapter-fetch`.

The adapter does not register routes automatically. Remix apps mount the Toolbar API explicitly from application routes.

## Route Handler

Create one route handler from your toolbar config:

```ts
// app/toolbar.server.ts
import { createToolbarRouteHandler } from "@repo/adapter-remix";
import toolbarConfig from "../toolbar.config";

export const toolbarRouteHandler = createToolbarRouteHandler(toolbarConfig);
```

Mount it from a Remix route that owns `/__toolbar/*`:

```ts
// app/routes/__toolbar.$.ts
import { toolbarRouteHandler } from "~/toolbar.server";

export const loader = toolbarRouteHandler;
export const action = toolbarRouteHandler;
```

The same route handler can be exported as both `loader` and `action` because the Toolbar Server receives the original `Request` and handles the method itself.

This adapter intentionally exposes only Remix-shaped APIs. Use `@repo/adapter-fetch` directly when a host wants a raw Fetch handler.

See [fetch-adapter.md](fetch-adapter.md) for the generic Fetch boundary.
