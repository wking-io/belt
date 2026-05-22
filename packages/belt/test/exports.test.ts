import { assert, describe, it } from "@effect/vitest";
import { defineToolbar, toolApiRoutePath } from "@riff-refine/belt";
import {
  booleanField,
  controlField,
  controlPanelTool,
  createToolbar as createRemixToolbar,
  createToolbarRouteHandler,
  defineControlPanel,
  textField
} from "@riff-refine/belt/remix";
import {
  controlPanelTool as reactControlPanelTool,
  createToolbar,
  createToolbarRendererModel,
  defineControlPanel as reactDefineControlPanel,
  numberField
} from "@riff-refine/belt/react";
import { createToolbarServer } from "@riff-refine/belt/server";
import { toolbarVite } from "@riff-refine/belt/vite";
import { worktreesTool } from "@riff-refine/belt/worktrees";
import { portlessResolver } from "@riff-refine/belt/worktrees/portless";

describe("@riff-refine/belt facade exports", () => {
  it("resolves the public package subpaths", () => {
    const config = defineToolbar({ tools: [] });
    const toolbar = createToolbar(config);

    assert.deepStrictEqual(createToolbarRendererModel(config), { tools: [] });
    assert.deepStrictEqual(createToolbarRendererModel(toolbar), { tools: [] });
    assert.strictEqual(typeof controlPanelTool, "function");
    assert.strictEqual(typeof defineControlPanel, "function");
    assert.strictEqual(typeof controlField.text, "function");
    assert.strictEqual(typeof createToolbarRouteHandler, "function");
    assert.strictEqual(typeof createToolbarServer, "function");
    assert.strictEqual(typeof toolbarVite, "function");
    assert.strictEqual(typeof worktreesTool, "function");
    assert.strictEqual(typeof portlessResolver, "function");
  });

  it("supports Control Panel config helpers from the Remix product facade", () => {
    const registration = controlPanelTool({
      fieldsets: {
        scene: {
          fields: {
            enabled: booleanField({ default: true }),
            title: textField({ default: "Preview" }),
            variant: controlField.select({
              default: "draft",
              options: [
                { label: "Draft", value: "draft" },
                { label: "Final", value: "final" }
              ]
            })
          }
        }
      }
    });
    const toolbar = createRemixToolbar({
      tools: [registration.tool]
    });

    const panel = defineControlPanel({
      fieldsets: {
        camera: {
          fields: {
            zoom: controlField.range({ default: 0.5 })
          }
        }
      }
    });

    assert.strictEqual(toolbar.toolbarConfig.tools[0]?.id, "control-panel");
    assert.strictEqual(panel.fieldsets.camera?.fields.zoom.type, "range");
  });

  it("supports Control Panel config helpers from the React product facade", () => {
    const panel = reactDefineControlPanel({
      fieldsets: {
        scene: {
          fields: {
            intensity: numberField({ default: 2 })
          }
        }
      }
    });
    const registration = reactControlPanelTool(panel);

    assert.strictEqual(registration.tool.id, "control-panel");
    assert.strictEqual(panel.fieldsets.scene?.fields.intensity.type, "number");
  });

  it("provides standard live Control Panel dependencies through Belt server facades", async () => {
    const registration = controlPanelTool({
      fieldsets: {
        scene: {
          fields: {
            title: textField({ default: "Preview" })
          }
        }
      }
    });
    const config = defineToolbar({
      tools: [registration.tool]
    });
    const server = createToolbarServer(config);
    const remix = createToolbarRouteHandler(config);

    try {
      const request = new Request(new URL(toolApiRoutePath("control-panel", "index"), "http://belt.local"));
      const serverResponse = await server.fetch(request);
      const remixResponse = await remix({
        request: new Request(new URL(toolApiRoutePath("control-panel", "index"), "http://belt.local"))
      });

      assert.strictEqual(serverResponse.status, 200);
      assert.strictEqual(remixResponse.status, 200);
      assert.deepStrictEqual(await serverResponse.json(), {
        config: registration.config,
        state: {
          activeFieldsetId: "scene",
          activeBaseByFieldset: {
            scene: { type: "defaults" }
          },
          currentValuesByFieldset: {
            scene: {
              title: "Preview"
            }
          }
        },
      });
    } finally {
      await server.dispose();
      await remix.dispose();
    }
  });
});
