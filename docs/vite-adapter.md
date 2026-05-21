# Vite Adapter

`@riff-refine/belt/vite` mounts the Toolbar API into Vite's development middleware stack.

The adapter builds on the JavaScript Fetch Toolbar Server from `@riff-refine/belt/server`, so Vite only owns the Node request/response translation layer.

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
  mountPath: "/internal/toolbar"
});
```
