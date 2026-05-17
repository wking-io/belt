# Toolbar Server

`@repo/server` is the JavaScript Fetch implementation of the Toolbar API.

Use this package directly when a JavaScript host can work with standard `Request` and `Response` objects:

```ts
import { createToolbarServer } from "@repo/server";
import toolbarConfig from "./toolbar.config";

const toolbarServer = createToolbarServer(toolbarConfig);

const response = await toolbarServer.fetch(new Request("http://local.test/__toolbar"));

await toolbarServer.dispose();
```

Framework adapters should build their framework-shaped APIs on top of this package. Cross-language adapters should share the Toolbar API protocol model from `@repo/core`; Fetch is only the JavaScript server implementation.
