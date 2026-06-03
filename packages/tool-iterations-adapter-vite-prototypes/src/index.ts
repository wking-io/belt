import fs from "node:fs";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { createPrototypeGraphIdentity, type PrototypeGraphIdentity } from "./identity.js";
import { appendPrototypeToImports } from "./imports.js";
import {
  createPrototypeModuleGraphResolver,
  isFileInside,
  type PrototypeModuleGraphResolver,
} from "./resolver.js";
import {
  createPrototypeRuntimeModule,
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
} from "./runtime.js";

export type PrototypeOverlayViteOptions = {
  srcDir?: string;
  prototypesDir?: string;
  aliases?: readonly string[];
  routePrefix?: string;
  queryParam?: string;
  appEntry?: string;
  buildPrototype?: string;
};

export {
  VIRTUAL_MODULE_ID,
  createPrototypeGraphIdentity,
  createPrototypeRuntimeModule,
  createPrototypeModuleGraphResolver,
};
export type { PrototypeGraphIdentity, PrototypeModuleGraphResolver };

export function prototypeIterationsVite(options: PrototypeOverlayViteOptions = {}): Plugin[] {
  let root = process.cwd();
  let srcDir = path.resolve(root, options.srcDir ?? "src");
  let prototypesDir = path.resolve(root, options.prototypesDir ?? "prototypes");
  const aliases = options.aliases ?? ["@/"];
  const routePrefix = normalizeRoutePrefix(options.routePrefix ?? "/__prototype/");
  const queryParam = options.queryParam ?? "prototype";
  const identity = createPrototypeGraphIdentity({ routePrefix, queryParam });
  const appEntry = normalizePublicPath(options.appEntry ?? "/src/main.tsx");
  const buildPrototype = options.buildPrototype ?? process.env.BELT_PROTOTYPE_BUILD_NAME;
  const debug = process.env.BELT_DEBUG_PROTOTYPE_OVERLAY === "1";
  let moduleResolver = createModuleResolver();
  let server: ViteDevServer | undefined;

  function getPrototypes(): string[] {
    return discoverPrototypeNames({ prototypesDir, includeDefault: true });
  }

  function createModuleResolver(): PrototypeModuleGraphResolver {
    return createPrototypeModuleGraphResolver({
      aliases,
      identity,
      srcDir,
      prototypesDir,
    });
  }

  const plugin: Plugin = {
    name: "belt-prototype-iterations",
    enforce: "pre",

    configResolved(config) {
      root = config.root;
      srcDir = path.resolve(root, options.srcDir ?? "src");
      prototypesDir = path.resolve(root, options.prototypesDir ?? "prototypes");
      moduleResolver = createModuleResolver();
    },

    configureServer(viteServer) {
      server = viteServer;
      server.watcher.add(prototypesDir);

      server.watcher.on("add", (file) => {
        if (isFileInside(file, prototypesDir)) {
          server?.moduleGraph.invalidateAll();
          server?.ws.send({ type: "full-reload" });
        }
      });

      server.watcher.on("unlink", (file) => {
        if (isFileInside(file, prototypesDir)) {
          server?.moduleGraph.invalidateAll();
          server?.ws.send({ type: "full-reload" });
        }
      });

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        const prototypeName = identity.fromRoutePath(url);

        if (!prototypeName) {
          next();
          return;
        }

        const htmlPath = path.resolve(root, "index.html");
        let html = fs.readFileSync(htmlPath, "utf8");

        html = injectPrototypeEntry(html, {
          appEntry,
          prototypeName,
          identity,
        });

        html = await viteServer.transformIndexHtml(url, html);

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.end(html);
      });
    },

    transformIndexHtml: {
      order: "pre",
      handler(html, context) {
        const prototypeName = identity.fromRoutePath(context.path) ?? buildPrototype;

        if (!prototypeName) {
          return html;
        }

        return injectPrototypeEntry(html, {
          appEntry,
          prototypeName,
          identity,
        });
      },
    },

    resolveId(source, importer) {
      if (source === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }

      const resolved = moduleResolver.resolveRequest(source, importer);

      if (debug && resolved) {
        console.error("[belt-prototype-iterations:resolve]", { source, importer, resolved });
      }

      return resolved?.resolvedId ?? null;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return createPrototypeRuntimeModule({
          current: "default",
          prototypes: getPrototypes(),
          routePrefix,
        });
      }

      const prototypeName = identity.fromModuleId(id);

      if (!prototypeName) {
        return null;
      }

      const filePath = identity.strip(id);
      const resolved = moduleResolver.resolveLoadedId(id);

      if (resolved) {
        return fs.readFileSync(resolved.filePath, "utf8");
      }

      if (!isFileInside(filePath, srcDir) && !isFileInside(filePath, prototypesDir)) {
        return null;
      }

      return fs.readFileSync(filePath, "utf8");
    },

    async transform(code, id) {
      const prototypeName = identity.fromModuleId(id);

      if (!prototypeName) {
        return null;
      }

      if (!isScriptModuleId(id, identity) || code.trimStart().startsWith("<")) {
        return null;
      }

      const result = await appendPrototypeToImports({
        code,
        id,
        prototypeName,
        aliases,
        identity,
      });

      if (debug && result) {
        console.error("[belt-prototype-iterations:transform]", { id, prototypeName });
      }

      return result;
    },
  };

  return [plugin];
}

function discoverPrototypeNames(args: {
  prototypesDir: string;
  includeDefault: boolean;
}): string[] {
  const prototypes = args.includeDefault ? ["default"] : [];

  try {
    for (const entry of fs.readdirSync(args.prototypesDir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== "default") {
        prototypes.push(entry.name);
      }
    }
  } catch {
    return prototypes;
  }

  return prototypes.sort((a, b) => {
    if (a === "default") return -1;
    if (b === "default") return 1;
    return a.localeCompare(b);
  });
}

function isScriptModuleId(id: string, identity: PrototypeGraphIdentity): boolean {
  const filePath = identity.strip(id);

  return /\.(m?[jt]sx?|vue|svelte)$/.test(filePath);
}

function injectPrototypeEntry(
  html: string,
  args: { appEntry: string; prototypeName: string; identity: PrototypeGraphIdentity },
): string {
  const entryPattern = new RegExp(
    `<script\\s+type=["']module["']\\s+src=["']${escapeRegExp(args.appEntry)}["']\\s*><\\/script>`,
  );

  return html.replace(
    entryPattern,
    `<script type="module" src="${args.identity.attach(args.appEntry, args.prototypeName)}"></script>`,
  );
}

function normalizeRoutePrefix(value: string): string {
  const prefix = `/${value.replace(/^\/+|\/+$/g, "")}/`;

  return prefix === "//" ? "/__prototype/" : prefix;
}

function normalizePublicPath(value: string): string {
  return value.startsWith("/") ? value : `/${value}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
