import type { WorktreeUrlResolver } from "@repo/tool-worktrees";

export type PortlessResolverOptions = {
  appName: string;
  tld?: string;
  mainBranches?: string[];
};

export function portlessResolver(options: PortlessResolverOptions): WorktreeUrlResolver {
  const tld = options.tld ?? "localhost";
  const mainBranches = new Set(options.mainBranches ?? ["main", "master"]);

  return {
    resolve(worktree) {
      const branch = normalizeBranch(worktree.branch);
      const hostname = mainBranches.has(branch)
        ? `${options.appName}.${tld}`
        : `${slugify(branch)}.${options.appName}.${tld}`;

      return [
        {
          id: options.appName,
          label: options.appName,
          primary: true,
          url: `https://${hostname}`
        }
      ];
    }
  };
}

function normalizeBranch(branch: string): string {
  return branch.replace(/^refs\/heads\//, "");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
