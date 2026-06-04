# Tools

Tools are installed through explicit Tool Registrations and rendered through explicit frontend composition.

## Tool Registration

A Tool Registration is the public Toolbar Config entry:

```ts
import { defineToolbar } from "@riff-refine/belt";
import { iterationsTool } from "@riff-refine/belt/iterations";
import { worktreeIterations } from "@riff-refine/belt/iterations/worktrees";
import { portlessResolver } from "@riff-refine/belt/iterations/worktrees/portless";
import { renderPerformanceTool } from "@riff-refine/belt/render-performance";

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
                appName: "myapp",
                primary: true,
              },
            ],
          }),
        }),
      ],
    }),
    renderPerformanceTool({
      historySize: 60,
      updateIntervalMs: 1000,
    }),
  ],
});
```

Built-in Tool helpers return Tool Registrations. The registration wraps the Tool Definition and may include Tool-specific config. The Tool Definition remains the backend implementation shape: stable id, label, optional Tool API, optional Tool API layer, and optional default runtime layer.

Host apps should register Tool Registrations, not raw Tool Definitions. Raw Tool Definitions are only for advanced backend wiring, such as tests or custom hosts that intentionally replace a built-in Tool runtime layer.

## Ready-Made React Tools

Ready-made React Tool components read typed local config from the active Toolbar Provider:

```tsx
import {
  ControlPanel,
  Iterations,
  RenderPerformance,
  Toolbar,
  createToolbar,
} from "@riff-refine/belt/react";
import toolbarConfig from "./toolbar.config";

const AppToolbar = createToolbar(toolbarConfig);

export function DevToolbar() {
  return (
    <AppToolbar.Provider>
      <Toolbar aria-label="Belt toolbar">
        <Toolbar.Body>
          <Toolbar.Left>
            <Iterations />
            <ControlPanel />
          </Toolbar.Left>
          <Toolbar.Right>
            <RenderPerformance>
              <RenderPerformance.Inp />
              <RenderPerformance.LayoutShift />
              <RenderPerformance.Jank />
            </RenderPerformance>
          </Toolbar.Right>
        </Toolbar.Body>
      </Toolbar>
    </AppToolbar.Provider>
  );
}
```

`Iterations` renders the toolbar combobox for the Iterations Tool. Worktrees are configured as an Iteration Provider with `worktreeIterations(...)`; they are not a standalone ready-made Tool in new code.

`ControlPanel` renders its toolbar trigger and drawer. It reads the Control Panel fieldsets from the Tool Registration config, then reads saved snapshots and state from the Control Panel Tool routes. Browser-local drafts stay in local storage until the user saves or discards them.

`RenderPerformance` renders one drawer for all metrics. Toolbar metric buttons are client-facing child components, so adding `RenderPerformance.Inp`, `RenderPerformance.LayoutShift`, or `RenderPerformance.Jank` controls which metrics appear in the toolbar. The Tool Registration config controls shared measurement options such as `historySize`, `targetFrameRate`, thresholds, and `updateIntervalMs`.

## Runtime Data

Toolbar API runtime data is separate from local renderer config.

The Toolbar API reports runtime metadata and Tool-owned data:

```txt
GET /__toolbar
GET /__toolbar/tools
GET /__toolbar/tools/:toolId
GET /__toolbar/tools/:toolId/*
```

Ready-made React Tool components may call those routes for runtime data, but they do not read renderer config from the API. Renderer config comes from the Tool Registration available through the Toolbar Provider.
