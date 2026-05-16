import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { ToolbarConfig } from "@repo/core";
import { createToolbarServer } from "@repo/server";
import type { Plugin } from "vite";

export function toolbarVite(config: ToolbarConfig): Plugin {
  const server = createToolbarServer(config);

  return {
    name: "toolbar",
    apply: "serve",
    configureServer(viteServer) {
      viteServer.middlewares.use("/__toolbar", async (req, res) => {
        const request = await toFetchRequest(req);
        const response = await server.fetch(request);
        await writeFetchResponse(res, response);
      });
    }
  };
}

async function toFetchRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `http://${host}`);
  const headers = new Headers();
  const method = req.method ?? "GET";

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  const init: RequestInit = {
    headers,
    method
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = Readable.toWeb(req) as BodyInit;
  }

  return new Request(url, init);
}

async function writeFetchResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  res.end(Buffer.from(await response.arrayBuffer()));
}
