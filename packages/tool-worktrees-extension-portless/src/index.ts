import { NonEmptyStringSchema } from "@repo/core";
import type { WorktreeUrlResolver } from "@repo/tool-worktrees";
import { Schema } from "effect";

export const PortlessDestinationOptionsSchema = Schema.Struct({
  id: Schema.optionalKey(NonEmptyStringSchema),
  label: Schema.optionalKey(NonEmptyStringSchema),
  appName: NonEmptyStringSchema,
  tld: Schema.optionalKey(NonEmptyStringSchema),
  primary: Schema.optionalKey(Schema.Boolean)
});

export type PortlessDestinationOptions = Schema.Schema.Type<typeof PortlessDestinationOptionsSchema>;

export const PortlessResolverOptionsSchema = Schema.Struct({
  tld: Schema.optionalKey(NonEmptyStringSchema),
  mainBranches: Schema.optionalKey(Schema.Array(NonEmptyStringSchema)),
  destinations: Schema.NonEmptyArray(PortlessDestinationOptionsSchema)
});

export type PortlessResolverOptions = Schema.Schema.Type<typeof PortlessResolverOptionsSchema>;

export function portlessResolver(options: PortlessResolverOptions): WorktreeUrlResolver {
  const config = Schema.decodeUnknownSync(PortlessResolverOptionsSchema)(options);
  const mainBranches = new Set((config.mainBranches ?? ["main", "master"]).map(normalizeBranch));

  return {
    resolve(worktree) {
      const branch = normalizeBranch(worktree.branch);
      const branchSlug = slugify(branch);
      const isMainBranch = mainBranches.has(branch);

      return config.destinations.map((destination, index) => {
        const tld = destination.tld ?? config.tld ?? "localhost";
        const hostname =
          isMainBranch || branchSlug.length === 0
            ? `${destination.appName}.${tld}`
            : `${branchSlug}.${destination.appName}.${tld}`;

        return {
          id: destination.id ?? destination.appName,
          label: destination.label ?? destination.appName,
          primary: destination.primary ?? index === 0,
          url: `https://${hostname}`
        };
      });
    }
  };
}

function normalizeBranch(branch: string): string {
  return branch.replace(/^refs\/heads\//, "").toLowerCase();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
