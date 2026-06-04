import { assert, it } from "@effect/vitest";
import { controlField, controlPanelTool } from "@repo/control-panel-core";
import { createToolbar } from "@repo/renderer-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ControlPanel, createControlPanelClient } from "../src/index.tsx";

it("renders the ready-made Control Panel toolbar trigger from registration config", () => {
  const toolbar = createToolbar({
    tools: [
      controlPanelTool({
        fieldsets: {
          scene: {
            fields: {
              enabled: controlField.boolean({ default: true }),
              title: controlField.text({ default: "Preview" }),
            },
            label: "Scene",
          },
        },
      }),
    ],
  });
  const html = renderToStaticMarkup(
    createElement(toolbar.Provider, null, createElement(ControlPanel)),
  );

  assert.match(html, /belt-control-panel-toolbar-item/);
  assert.match(html, /aria-label="Open Control Panel"/);
  assert.match(html, /aria-expanded="false"/);
});

it("does not render when the Control Panel tool is not registered", () => {
  const toolbar = createToolbar({
    tools: [],
  });
  const html = renderToStaticMarkup(
    createElement(toolbar.Provider, null, createElement(ControlPanel)),
  );

  assert.strictEqual(html, "");
});

it("uses the Control Panel API route paths", async () => {
  const requests: { readonly body?: string; readonly method: string; readonly url: string }[] = [];
  const client = createControlPanelClient({
    baseUrl: "http://belt.local",
    fetch: async (input, init) => {
      requests.push({
        method: init?.method ?? "GET",
        url: String(input),
        ...(typeof init?.body === "string" ? { body: init.body } : {}),
      });

      return new Response(
        JSON.stringify({
          config: {
            configHash: "hash",
            fieldsets: {},
          },
          state: {
            activeBaseByFieldset: {},
            currentValuesByFieldset: {},
          },
        }),
        {
          status: 200,
        },
      );
    },
  });

  await client.index();
  await client.selectFieldset("scene");
  await client.selectBase("scene", {
    snapshotId: "snapshot_1",
    type: "snapshot",
  });
  await client.branchSnapshot("scene", "Draft", {
    enabled: true,
    title: "Preview",
  });
  await client.saveSnapshot("scene", {
    title: "Saved",
  });
  await client.deleteSnapshot("scene", "snapshot_1");
  await client.snapshots();

  assert.deepStrictEqual(requests, [
    {
      method: "GET",
      url: "http://belt.local/__toolbar/tools/control-panel/",
    },
    {
      body: JSON.stringify({ fieldsetId: "scene" }),
      method: "POST",
      url: "http://belt.local/__toolbar/tools/control-panel/state/select-fieldset",
    },
    {
      body: JSON.stringify({
        base: {
          snapshotId: "snapshot_1",
          type: "snapshot",
        },
        fieldsetId: "scene",
      }),
      method: "POST",
      url: "http://belt.local/__toolbar/tools/control-panel/state/select-base",
    },
    {
      body: JSON.stringify({
        fieldsetId: "scene",
        name: "Draft",
        values: {
          enabled: true,
          title: "Preview",
        },
      }),
      method: "POST",
      url: "http://belt.local/__toolbar/tools/control-panel/snapshots/branch",
    },
    {
      body: JSON.stringify({
        fieldsetId: "scene",
        values: {
          title: "Saved",
        },
      }),
      method: "POST",
      url: "http://belt.local/__toolbar/tools/control-panel/snapshots/save",
    },
    {
      body: JSON.stringify({
        fieldsetId: "scene",
        snapshotId: "snapshot_1",
      }),
      method: "POST",
      url: "http://belt.local/__toolbar/tools/control-panel/snapshots/delete",
    },
    {
      method: "GET",
      url: "http://belt.local/__toolbar/tools/control-panel/snapshots",
    },
  ]);
});
