import { defineToolbar } from "@riff-refine/belt";
import {
  booleanField,
  controlField,
  controlPanelTool,
  rangeField,
  selectField,
  textField,
} from "@riff-refine/belt/react";
import { renderPerformanceTool } from "@riff-refine/belt/render-performance";
import { worktreesTool } from "@riff-refine/belt/worktrees";
import { portlessResolver } from "@riff-refine/belt/worktrees/portless";

export const previewControlPanel = controlPanelTool({
  fieldsets: {
    toolbar: {
      label: "Toolbar",
      fields: {
        enabled: booleanField({
          default: true,
          label: "Enabled",
        }),
        density: selectField({
          default: "compact",
          label: "Density",
          options: [
            { label: "Compact", value: "compact" },
            { label: "Comfortable", value: "comfortable" },
          ],
        }),
        intensity: rangeField({
          default: 0.48,
          label: "Intensity",
          max: 1,
          min: 0,
          step: 0.01,
          unit: "%",
        }),
      },
    },
    worktree: {
      label: "Worktree",
      fields: {
        branchName: textField({
          default: "feature/react-preview",
          label: "Branch name",
        }),
        destination: controlField.select({
          default: "web",
          label: "Destination",
          options: [
            { label: "Web", value: "web" },
            { label: "Docs", value: "docs" },
          ],
        }),
      },
    },
  },
});

export default defineToolbar({
  tools: [
    worktreesTool({
      cwd: new URL("../..", import.meta.url).pathname,
      resolver: portlessResolver({
        destinations: [
          {
            id: "web",
            label: "Web",
            appName: "toolbar-preview",
            primary: true,
          },
          {
            id: "docs",
            label: "Docs",
            appName: "docs.toolbar-preview",
          },
        ],
      }),
    }),
    previewControlPanel,
    renderPerformanceTool(),
  ],
});
