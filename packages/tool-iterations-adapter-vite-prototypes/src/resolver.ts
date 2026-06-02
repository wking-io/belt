import fs from "node:fs";
import path from "node:path";
import type { PrototypeGraphIdentity } from "./identity.js";

const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts", ".vue", ".svelte"];

export type PrototypeModuleResolution = {
  prototypeName: string;
  request: string;
  cleanRequest: string;
  filePath: string;
  resolvedId: string;
  source: "prototype" | "src";
};

export type PrototypeModuleGraphResolver = {
  resolveRequest(source: string, importer?: string): PrototypeModuleResolution | null;
  resolveLoadedId(id: string): PrototypeModuleResolution | null;
};

export function createPrototypeModuleGraphResolver(args: {
  aliases: readonly string[];
  identity: PrototypeGraphIdentity;
  srcDir: string;
  prototypesDir: string;
}): PrototypeModuleGraphResolver {
  return {
    resolveRequest(source, importer) {
      const prototypeName = args.identity.fromModuleRequest(source, importer);

      if (!prototypeName) {
        return null;
      }

      const cleanRequest = args.identity.strip(source);
      const relativePath = getAppRelativePath(cleanRequest, args.aliases);

      if (!relativePath) {
        return null;
      }

      return resolvePrototypeModule({
        prototypeName,
        request: source,
        cleanRequest,
        relativePath,
        srcDir: args.srcDir,
        prototypesDir: args.prototypesDir,
        identity: args.identity
      });
    },

    resolveLoadedId(id) {
      const prototypeName = args.identity.fromModuleId(id);

      if (!prototypeName) {
        return null;
      }

      const cleanRequest = args.identity.strip(id);
      const relativePath = getLoadedRelativePath({
        filePath: cleanRequest,
        srcDir: args.srcDir,
        prototypesDir: args.prototypesDir
      });

      if (!relativePath) {
        return null;
      }

      return resolvePrototypeModule({
        prototypeName,
        request: id,
        cleanRequest,
        relativePath,
        srcDir: args.srcDir,
        prototypesDir: args.prototypesDir,
        identity: args.identity
      });
    }
  };
}

export function resolveOverlayFile(args: {
  prototypeName: string;
  relativePath: string;
  srcDir: string;
  prototypesDir: string;
}): string | null {
  const cleanRelativePath = stripLeadingSlash(args.relativePath);

  if (args.prototypeName !== "default") {
    const prototypeBase = path.join(args.prototypesDir, args.prototypeName, cleanRelativePath);
    const prototypeFile = resolveFile(prototypeBase);

    if (prototypeFile) {
      return prototypeFile;
    }
  }

  return resolveFile(path.join(args.srcDir, cleanRelativePath));
}

export function resolveFile(basePath: string): string | null {
  const candidates = [
    basePath,
    ...extensions.map((extension) => `${basePath}${extension}`),
    ...extensions.map((extension) => path.join(basePath, `index${extension}`))
  ];

  return candidates.find(isFile) ?? null;
}

export function isFileInside(filePath: string, parentDir: string): boolean {
  const relative = path.relative(parentDir, filePath);

  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export function stripLeadingSlash(value: string): string {
  return value.replace(/^\/+/, "");
}

function resolvePrototypeModule(args: {
  prototypeName: string;
  request: string;
  cleanRequest: string;
  relativePath: string;
  srcDir: string;
  prototypesDir: string;
  identity: PrototypeGraphIdentity;
}): PrototypeModuleResolution | null {
  const resolved = resolveOverlayFileWithSource({
    prototypeName: args.prototypeName,
    relativePath: args.relativePath,
    srcDir: args.srcDir,
    prototypesDir: args.prototypesDir
  });

  if (!resolved) {
    return null;
  }

  return {
    prototypeName: args.prototypeName,
    request: args.request,
    cleanRequest: args.cleanRequest,
    filePath: resolved.filePath,
    resolvedId: args.identity.attach(resolved.filePath, args.prototypeName),
    source: resolved.source
  };
}

function resolveOverlayFileWithSource(args: {
  prototypeName: string;
  relativePath: string;
  srcDir: string;
  prototypesDir: string;
}): { filePath: string; source: "prototype" | "src" } | null {
  const cleanRelativePath = stripLeadingSlash(args.relativePath);

  if (args.prototypeName !== "default") {
    const prototypeBase = path.join(args.prototypesDir, args.prototypeName, cleanRelativePath);
    const prototypeFile = resolveFile(prototypeBase);

    if (prototypeFile) {
      return { filePath: prototypeFile, source: "prototype" };
    }
  }

  const srcFile = resolveFile(path.join(args.srcDir, cleanRelativePath));

  return srcFile ? { filePath: srcFile, source: "src" } : null;
}

function getAppRelativePath(source: string, aliases: readonly string[]): string | null {
  if (source.startsWith("/src/")) {
    return source.slice("/src/".length);
  }

  for (const alias of aliases) {
    if (source.startsWith(alias)) {
      return source.slice(alias.length);
    }
  }

  return null;
}

function getLoadedRelativePath(args: {
  filePath: string;
  srcDir: string;
  prototypesDir: string;
}): string | null {
  if (isFileInside(args.filePath, args.srcDir)) {
    return path.relative(args.srcDir, args.filePath);
  }

  if (!isFileInside(args.filePath, args.prototypesDir)) {
    return null;
  }

  const relativeToPrototypes = path.relative(args.prototypesDir, args.filePath);
  const [, ...relativePathParts] = relativeToPrototypes.split(path.sep);

  return relativePathParts.length > 0 ? relativePathParts.join(path.sep) : null;
}

function isFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
