import { defineToolbar } from "@riff-refine/belt";
import { worktreesTool } from "@riff-refine/belt/worktrees";
import { portlessResolver } from "@riff-refine/belt/worktrees/portless";

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
