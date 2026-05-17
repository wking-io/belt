import { defineToolbar } from "@repo/core";
import { worktreesTool } from "@repo/tool-worktrees";
import { portlessResolver } from "@repo/tool-worktrees-extension-portless";

export default defineToolbar({
  tools: [
    worktreesTool({
      resolver: portlessResolver({
        destinations: [
          {
            id: "web",
            label: "Web",
            appName: "toolbar-example"
          }
        ]
      })
    })
  ]
});
