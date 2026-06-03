import { createWorktreesClient } from "@repo/tool-worktrees";
import type { WorktreeEntry } from "@repo/tool-worktrees";

export type WorktreesRendererModel = {
  current: WorktreeEntry | undefined;
  worktrees: readonly WorktreeEntry[];
};

export async function createWorktreesRendererModel(): Promise<WorktreesRendererModel> {
  const { worktrees } = await createWorktreesClient().list();

  return {
    current: worktrees.find((worktree) => worktree.current),
    worktrees,
  };
}
