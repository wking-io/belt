import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ToolbarTool } from "@repo/core";

const execFileAsync = promisify(execFile);

export type WorktreeDestination = {
  id: string;
  label: string;
  url: string;
  primary?: boolean;
  reachable?: boolean;
};

export type WorktreeEntry = {
  id: string;
  branch: string;
  path: string;
  current: boolean;
  destinations: WorktreeDestination[];
};

export type DiscoveredWorktree = {
  branch: string;
  path: string;
};

export type WorktreeUrlResolver = {
  resolve(worktree: DiscoveredWorktree): Promise<WorktreeDestination[]> | WorktreeDestination[];
};

export type WorktreesToolOptions = {
  resolver: WorktreeUrlResolver;
  cwd?: string;
};

export function worktreesTool(options: WorktreesToolOptions): ToolbarTool {
  return {
    id: "worktrees",
    label: "Worktrees",
    routes: {
      index: async () => Response.json({ worktrees: await listWorktrees(options) })
    }
  };
}

export function createWorktreesClient(options?: { basePath?: string }) {
  const basePath = options?.basePath ?? "/__toolbar/tools/worktrees";

  return {
    async list(): Promise<{ worktrees: WorktreeEntry[] }> {
      const response = await fetch(basePath);

      if (!response.ok) {
        throw new Error(`Failed to load worktrees: ${response.status}`);
      }

      return response.json() as Promise<{ worktrees: WorktreeEntry[] }>;
    }
  };
}

async function listWorktrees(options: WorktreesToolOptions): Promise<WorktreeEntry[]> {
  const currentPath = options.cwd ?? process.cwd();
  const worktrees = await discoverWorktrees(currentPath);

  return Promise.all(
    worktrees.map(async (worktree) => ({
      id: slugify(worktree.branch),
      branch: worktree.branch,
      path: worktree.path,
      current: worktree.path === currentPath,
      destinations: await options.resolver.resolve(worktree)
    }))
  );
}

async function discoverWorktrees(cwd: string): Promise<DiscoveredWorktree[]> {
  const { stdout } = await execFileAsync("git", ["worktree", "list", "--porcelain"], {
    cwd,
    encoding: "utf8"
  });

  return stdout
    .trim()
    .split("\n\n")
    .filter(Boolean)
    .map((block: string) => {
      const lines = block.split("\n");
      const path = lines.find((line: string) => line.startsWith("worktree "))?.slice("worktree ".length) ?? "";
      const branch = lines.find((line: string) => line.startsWith("branch "))?.slice("branch refs/heads/".length) ?? "detached";

      return { branch, path };
    });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
