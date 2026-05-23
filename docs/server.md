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

Tools can declare default runtime layers for their backend services. For example, the registered Control Panel tool can read and write its snapshot store through `createToolbarServer` without host apps manually providing the Control Panel store layer.

Tests and alternate hosts can replace a Tool's default runtime by registering a fully wired Tool definition:

```ts
import { Layer } from "effect";
import { defineToolbar } from "@riff-refine/belt";
import { controlPanelTool } from "@repo/control-panel-core";
import { createToolbarServer } from "@repo/server";

const registration = controlPanelTool(controlPanelConfig);
const { runtimeLayer: _defaultRuntimeLayer, ...tool } = registration.tool;

const toolbarServer = createToolbarServer(defineToolbar({
  tools: [
    {
      ...tool,
      apiLayer: Layer.provide(tool.apiLayer, customSnapshotStoreLayer)
    }
  ]
}));
```

Runtime-loaded configs still erase the exact TypeScript type of each concrete Tool requirement, but the runtime path remains safe for standard tools because those Tools carry their own default runtime layers. Advanced callers only need to think about Effect layer assembly when they intentionally replace a Tool's default runtime wiring.

Framework adapters should build their framework-shaped APIs on top of this package. Cross-language adapters should share the Toolbar API protocol model from `@riff-refine/belt`; Fetch is only the JavaScript server implementation.
