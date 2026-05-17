import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { createToolbarFetchHandler, type ToolbarFetchHandler } from "@repo/adapter-fetch";
import type { ToolbarConfig } from "@repo/core";
import type { Connect, Plugin } from "vite";

const defaultMountPath = "/__toolbar";

export type ToolbarViteOptions = {
  readonly mountPath?: string;
};

export function toolbarVite(config: ToolbarConfig, options: ToolbarViteOptions = {}): Plugin {
  const fetch = createToolbarFetchHandler(config);
  const mountPath = normalizeMountPath(options.mountPath ?? defaultMountPath);

  return {
    name: "toolbar",
    apply: "serve",
    configureServer(viteServer) {
      viteServer.httpServer?.once("close", () => {
        void fetch.dispose();
      });

      viteServer.middlewares.use(mountPath, createToolbarViteMiddleware(fetch, { mountPath }));
    }
  };
}

export function createToolbarViteMiddleware(
  fetch: ToolbarFetchHandler,
  options: Required<ToolbarViteOptions>
): Connect.NextHandleFunction {
  const mountPath = normalizeMountPath(options.mountPath);

  return async (req, res, next) => {
    try {
      const request = await toFetchRequest(req, { mountPath });
      const response = await fetch(request);

      await writeFetchResponse(res, response);
    } catch (error) {
      next(error);
    }
  };
}

async function toFetchRequest(req: IncomingMessage, options: Required<ToolbarViteOptions>): Promise<Request> {
  const host = req.headers.host ?? "localhost";
  const url = new URL(withMountPath(req.url ?? "/", options.mountPath), `http://${host}`);
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
    (init as RequestInit & { duplex: "half" }).duplex = "half";
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

function normalizeMountPath(path: string): string {
  const normalizedPath = `/${path.replace(/^\/+|\/+$/g, "")}`;

  return normalizedPath === "/" ? defaultMountPath : normalizedPath;
}

function withMountPath(url: string, mountPath: string): string {
  const parsed = new URL(url, "http://toolbar.local");

  if (parsed.pathname === mountPath || parsed.pathname.startsWith(`${mountPath}/`)) {
    return `${parsed.pathname}${parsed.search}`;
  }

  const childPath = parsed.pathname === "/" ? "" : parsed.pathname;

  return `${mountPath}${childPath}${parsed.search}`;
}
