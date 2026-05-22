# Toolbar Server

`@riff-refine/belt/server` is the JavaScript Fetch implementation of the Toolbar API.

Use this package directly when a JavaScript host can work with standard `Request` and `Response` objects:

```ts
import { createToolbarServer } from "@riff-refine/belt/server";
import toolbarConfig from "./toolbar.config";

const toolbarServer = createToolbarServer(toolbarConfig);

const response = await toolbarServer.fetch(new Request("http://local.test/__toolbar"));

await toolbarServer.dispose();
```

`createToolbarServer` accepts either a plain Toolbar Config from `defineToolbar` or a Toolbar Definition from a renderer package's `createToolbar`. The server extracts backend Tool Registration through the shared core protocol shape.

The public Belt server also assembles standard live dependencies for built-in tools. For example, a registered Control Panel tool can read and write its snapshot store without host apps manually providing the Control Panel store layer.

Framework adapters should build their framework-shaped APIs on top of this package. Cross-language adapters should share the Toolbar API protocol model from `@riff-refine/belt`; Fetch is only the JavaScript server implementation.
