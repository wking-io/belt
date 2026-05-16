import type { ToolbarConfig } from "@repo/core";

export type ToolbarServer = {
  fetch(request: Request): Promise<Response>;
};

export function createToolbarServer(config: ToolbarConfig): ToolbarServer {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      const segments = url.pathname.split("/").filter(Boolean);

      if (segments[0] !== "__toolbar") {
        return json({ error: "Not found" }, { status: 404 });
      }

      if (segments.length === 1) {
        return json({
          tools: config.tools.map((tool) => ({
            id: tool.id,
            label: tool.label
          }))
        });
      }

      if (segments[1] !== "tools") {
        return json({ error: "Not found" }, { status: 404 });
      }

      if (segments.length === 2) {
        return json({
          tools: config.tools.map((tool) => ({
            id: tool.id,
            label: tool.label
          }))
        });
      }

      const tool = config.tools.find((candidate) => candidate.id === segments[2]);

      if (!tool) {
        return json({ error: "Unknown tool" }, { status: 404 });
      }

      const routeName = segments.slice(3).join("/") || "index";
      const route = tool.routes?.[routeName];

      if (!route) {
        return json({ error: "Unknown tool route" }, { status: 404 });
      }

      return route(request);
    }
  };
}

function json(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), {
    ...init,
    headers
  });
}
