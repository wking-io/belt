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
UNKNOWN_TOOL_ROUTE
TOOL_ERROR
INTERNAL_ERROR
```

Recommended status mapping:

```txt
INVALID_REQUEST      400
NOT_FOUND            404
METHOD_NOT_ALLOWED   405
UNKNOWN_TOOL         404
UNKNOWN_TOOL_ROUTE   404
TOOL_ERROR           500
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
- Tool route responses are wrapped in the standard success or error envelope by the Toolbar Server.
- Tool-specific response payloads live under the success envelope's `data` field.
- Tool failures that are expected and recoverable should become `TOOL_ERROR`; missing tools or routes use `UNKNOWN_TOOL` and `UNKNOWN_TOOL_ROUTE`.

## Effect Schemas

The initial Effect v4 schemas live in `@repo/core`:

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

These schemas are the JavaScript implementation's source of truth for request and response payloads. `@repo/core` also exports the shared Effect HTTP `ToolbarApi` definition, while `@repo/server` provides the JavaScript Fetch implementation.
