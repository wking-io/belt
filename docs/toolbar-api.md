# Toolbar API

The Toolbar API is Belt's language-neutral HTTP protocol. JavaScript packages implement it with Effect v4 and Effect HTTP-compatible schemas, but the protocol itself is ordinary HTTP plus JSON so future non-JavaScript adapters can proxy or implement it.

## Base Path

All routes live under:

```txt
/__toolbar
```

Adapters may mount this path into different frameworks, but they must not rename it without an explicit app-level proxy.

## Response Envelopes

Successful responses use:

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

`error.details` may be included for machine-readable context. It must not be required for human comprehension; `message` should be useful on its own.

## Error Codes

Initial protocol error codes:

```txt
INVALID_REQUEST
NOT_FOUND
METHOD_NOT_ALLOWED
UNKNOWN_TOOL
INTERNAL_ERROR
```

Recommended status mapping:

```txt
INVALID_REQUEST      400
NOT_FOUND            404
METHOD_NOT_ALLOWED   405
UNKNOWN_TOOL         404
INTERNAL_ERROR       500
```

## Routes

### `GET /__toolbar`

Returns API metadata and registered tool metadata.

```json
{
  "ok": true,
  "data": {
    "apiVersion": 1,
    "tools": [
      {
        "id": "worktrees",
        "label": "Worktrees",
        "routes": ["index"]
      }
    ]
  }
}
```

### `GET /__toolbar/tools`

Returns registered tool metadata.

```json
{
  "ok": true,
  "data": {
    "tools": [
      {
        "id": "worktrees",
        "label": "Worktrees",
        "routes": ["index"]
      }
    ]
  }
}
```

### `GET /__toolbar/tools/:toolId`

Returns metadata for one registered tool.

### `/__toolbar/tools/:toolId/*routePath`

Dispatches to a route owned by the registered tool.

Tool route conventions:

- `routePath` is relative to the tool and must not include the API base path.
- An empty route path resolves to `index`.
- Tool-owned Effect HTTP APIs define their own request and response schemas with `HttpApi`, `HttpApiGroup`, and `HttpApiEndpoint`.
- Tool-owned Effect HTTP APIs are authored with tool-relative paths, then mounted by the server under `/__toolbar/tools/:toolId`.
- Missing tools use `UNKNOWN_TOOL`; missing tool API routes are handled by the mounted tool API.

JavaScript tools should keep route definitions close to the tool package:

```ts
import { normalizeRoute } from "@riff-refine/belt";
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

export class MyToolApiGroup extends HttpApiGroup.make("my-tool")
  .add(
    HttpApiEndpoint.get("index", normalizeRoute("index"), {
      success: MyToolIndexResponseSchema
    }),
    HttpApiEndpoint.post("save", normalizeRoute("snapshots/save"), {
      payload: MyToolSaveRequestSchema,
      success: MyToolSaveResponseSchema
    })
  )
{}

export class MyToolApi extends HttpApi.make("my-tool-api")
  .add(MyToolApiGroup)
{}
```

`normalizeRoute(routePath)` is intentionally thin: it only normalizes a tool-relative route key into the `/${string}` path shape required by Effect HTTP. It does not wrap `HttpApiEndpoint.get`, `HttpApiEndpoint.post`, or any other Effect APIs.

Clients can compose the core Toolbar API client with a tool-owned API:

```ts
const toolbar = yield* makeToolbarClient({ baseUrl: "/__toolbar" });
const myTool = yield* toolbar.tool(MyToolApi, "my-tool");
```

## Effect Schemas

The initial Effect v4 schemas live in `@riff-refine/belt`:

```txt
ToolbarErrorCodeSchema
ToolbarErrorSchema
ToolbarErrorEnvelopeSchema
ToolbarToolMetadataSchema
ToolbarRootDataSchema
ToolbarToolsDataSchema
ToolbarToolDataSchema
ToolbarSuccessEnvelopeSchema
```

These schemas are the JavaScript implementation's source of truth for request and response payloads. `@riff-refine/belt` also exports the shared Effect HTTP `ToolbarApi` definition, while `@riff-refine/belt/server` provides the JavaScript Fetch implementation.
