import { access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ToolbarConfig } from "@repo/core";

export const toolbarConfigFilenames = [
  "toolbar.config.ts",
  "toolbar.config.mts",
  "toolbar.config.js",
  "toolbar.config.mjs"
] as const;

export type ToolbarConfigFilename = (typeof toolbarConfigFilenames)[number];

export type FindToolbarConfigOptions = {
  cwd?: string;
  filenames?: readonly string[];
};

export type LoadToolbarConfigOptions = FindToolbarConfigOptions & {
  path?: string;
};

export async function findToolbarConfig(options: FindToolbarConfigOptions = {}): Promise<string | undefined> {
  const cwd = options.cwd ?? process.cwd();
  const filenames = options.filenames ?? toolbarConfigFilenames;

  for (const filename of filenames) {
    const candidate = path.resolve(cwd, filename);

    if (await exists(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export async function loadToolbarConfig(options: LoadToolbarConfigOptions = {}): Promise<ToolbarConfig> {
  const configPath = options.path ? path.resolve(options.path) : await findToolbarConfig(options);

  if (!configPath) {
    throw new Error(`Could not find toolbar config. Looked for: ${toolbarConfigFilenames.join(", ")}`);
  }

  const loaded = await import(pathToFileURL(configPath).href) as { default?: unknown };

  if (!isToolbarConfig(loaded.default)) {
    throw new Error(`Toolbar config must default-export a toolbar config object: ${configPath}`);
  }

  return loaded.default;
}

function isToolbarConfig(value: unknown): value is ToolbarConfig {
  if (!value || typeof value !== "object") return false;

  const candidate = value as { tools?: unknown };

  return Array.isArray(candidate.tools);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
