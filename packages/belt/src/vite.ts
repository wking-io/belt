import {
  createToolbarViteMiddleware,
  normalizeToolbarMountPath,
  type ToolbarViteOptions,
} from "@repo/adapter-vite";
import { toolbarApiBasePath, type ToolbarConfigSource } from "@repo/core";
import { createToolbarServer } from "./server.js";

export {
  createToolbarViteMiddleware,
  normalizeToolbarMountPath,
  type ToolbarViteOptions,
} from "@repo/adapter-vite";

type ToolbarVitePlugin = {
  readonly name: "toolbar";
  readonly apply: "serve";
  readonly configureServer: (viteServer: {
    readonly httpServer?: {
      readonly once: (event: "close", listener: () => void) => void;
    };
    readonly middlewares: {
      readonly use: (
        mountPath: string,
        middleware: ReturnType<typeof createToolbarViteMiddleware>,
      ) => void;
    };
  }) => void;
};

export function toolbarVite(
  config: ToolbarConfigSource,
  options: ToolbarViteOptions = {},
): ToolbarVitePlugin {
  const server = createToolbarServer(config);
  const mountPath = normalizeToolbarMountPath(options.mountPath ?? toolbarApiBasePath);

  return {
    name: "toolbar",
    apply: "serve",
    configureServer(viteServer) {
      viteServer.httpServer?.once("close", () => {
        void server.dispose();
      });

      viteServer.middlewares.use(mountPath, createToolbarViteMiddleware(server, { mountPath }));
    },
  };
}
