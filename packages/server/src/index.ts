import { Effect } from "effect";
import { toolbarError, toolbarSuccess, toToolbarToolMetadata, type ToolbarConfig } from "@repo/core";

export type ToolbarServer = {
  fetch(request: Request): Promise<Response>;
};

export function createToolbarServer(config: ToolbarConfig): ToolbarServer {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      const segments = url.pathname.split("/").filter(Boolean);

      if (segments[0] !== "__toolbar") {
        return json(toolbarError({ code: "NOT_FOUND", message: "Not found" }), { status: 404 });
      }

      if (segments.length === 1) {
        return json(toolbarSuccess({
          apiVersion: 1,
          tools: config.tools.map(toToolbarToolMetadata)
        }));
      }

      if (segments[1] !== "tools") {
        return json(toolbarError({ code: "NOT_FOUND", message: "Not found" }), { status: 404 });
      }

      if (segments.length === 2) {
        return json(toolbarSuccess({
          tools: config.tools.map(toToolbarToolMetadata)
        }));
      }

      const tool = config.tools.find((candidate) => candidate.id === segments[2]);

      if (!tool) {
        return json(toolbarError({ code: "UNKNOWN_TOOL", message: "Unknown tool" }), { status: 404 });
      }

      const routeName = segments.slice(3).join("/") || "index";
      const route = tool.routes?.[routeName];

      if (!route) {
        return json(toolbarError({ code: "UNKNOWN_TOOL_ROUTE", message: "Unknown tool route" }), { status: 404 });
      }

      try {
        const data = await Effect.runPromise(route(request) as Effect.Effect<unknown, unknown, never>);
        return json(toolbarSuccess(data));
      } catch {
        return json(toolbarError({ code: "TOOL_ERROR", message: "Tool route failed" }), { status: 500 });
      }
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
