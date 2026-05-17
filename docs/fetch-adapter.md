# Fetch Adapter

`@repo/adapter-fetch` exposes the framework-neutral Toolbar Server as a Fetch-compatible handler.

Use this adapter when a host environment already speaks `Request` and `Response`, or when another adapter wants to build framework-specific ergonomics on top of Fetch.

```ts
import { createToolbarFetchHandler } from "@repo/adapter-fetch";
import toolbarConfig from "./toolbar.config";

const toolbarFetchHandler = createToolbarFetchHandler(toolbarConfig);

const response = await toolbarFetchHandler(new Request("http://local.test/__toolbar"));
```

The returned handler owns a Toolbar Server instance and exposes `dispose()` for cleanup:

```ts
await toolbarFetchHandler.dispose();
```

Framework adapters should prefer using this package instead of calling `@repo/server` directly, unless they need lower-level server composition.
