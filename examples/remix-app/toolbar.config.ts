import { defineToolbar } from "@riff-refine/belt";
import { iterationsTool } from "@riff-refine/belt/iterations";
import { prototypeIterations } from "@riff-refine/belt/iterations/prototypes";
import { worktreeIterations } from "@riff-refine/belt/iterations/worktrees";
import { portlessResolver } from "@riff-refine/belt/iterations/worktrees/portless";

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
                appName: "toolbar-example"
              }
            ]
          })
        }),
        prototypeIterations()
      ]
    })
  ]
});
