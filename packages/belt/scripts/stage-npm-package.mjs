import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const workspaceRoot = path.resolve(packageRoot, "../..");
const stagingRoot = path.join(packageRoot, "npm");

const publicEntrypoints = {
  ".": "index",
  "./config": "config",
  "./remix": "remix",
  "./react": "react",
  "./server": "server",
  "./theme": "theme",
  "./theme.css": "theme.css",
  "./iterations": "iterations",
  "./iterations/worktrees": "iterations-worktrees",
  "./iterations/worktrees/portless": "iterations-worktrees-portless",
  "./iterations/prototypes": "iterations-prototypes",
  "./iterations/prototypes/vite": "iterations-prototypes-vite",
  "./vite": "vite",
  "./worktrees": "worktrees",
  "./worktrees/portless": "worktrees-portless",
  "./worktrees/remix": "worktrees-remix",
};

const internalPackages = {
  "@repo/adapter-remix": "adapter-remix",
  "@repo/adapter-vite": "adapter-vite",
  "@repo/config": "config",
  "@repo/control-panel-core": "control-panel-core",
  "@repo/core": "core",
  "@repo/renderer-react": "renderer-react",
  "@repo/renderer-remix": "renderer-remix",
  "@repo/server": "server",
  "@repo/theme-css": "theme-css",
  "@repo/tool-iterations": "tool-iterations",
  "@repo/tool-iterations-adapter-vite-prototypes": "tool-iterations-adapter-vite-prototypes",
  "@repo/tool-iterations-provider-prototypes": "tool-iterations-provider-prototypes",
  "@repo/tool-iterations-provider-worktrees": "tool-iterations-provider-worktrees",
  "@repo/tool-iterations-provider-worktrees-extension-portless":
    "tool-iterations-provider-worktrees-extension-portless",
  "@repo/tool-worktrees": "tool-worktrees",
  "@repo/tool-worktrees-extension-portless": "tool-worktrees-extension-portless",
  "@repo/tool-worktrees-renderer-remix": "tool-worktrees-renderer-remix",
};

await rm(stagingRoot, { force: true, recursive: true });
await mkdir(path.join(stagingRoot, "_internal"), { recursive: true });

await copyPublicEntrypoints();
await copyInternalPackages();
await cp(
  path.join(workspaceRoot, "packages/theme-css/dist/theme.css"),
  path.join(stagingRoot, "theme.css"),
);
await rewriteThemeCssAssetUrls();
await rewriteInternalImports(stagingRoot);
await writePackageJson();

console.log(`Staged npm package at ${path.relative(workspaceRoot, stagingRoot)}`);

async function copyPublicEntrypoints() {
  for (const fileName of Object.values(publicEntrypoints)) {
    if (fileName.endsWith(".css")) continue;

    await copyCompiledModule(path.join(packageRoot, "dist"), stagingRoot, fileName);
  }
}

async function copyInternalPackages() {
  for (const packageDir of Object.values(internalPackages)) {
    const source = path.join(workspaceRoot, "packages", packageDir, "src");
    const compiled = path.join(workspaceRoot, "packages", packageDir, "dist");
    const target = path.join(stagingRoot, "_internal", packageDir);

    await mkdir(target, { recursive: true });
    await copyCompiledFromSourceTree(source, compiled, target);
  }
}

async function copyCompiledFromSourceTree(source, compiled, target) {
  const entries = await readdirWithTypes(source);

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);

    if (entry.isDirectory()) {
      const compiledPath = path.join(compiled, entry.name);
      const targetPath = path.join(target, entry.name);

      await mkdir(targetPath, { recursive: true });
      await copyCompiledFromSourceTree(sourcePath, compiledPath, targetPath);
      continue;
    }

    if (!entry.name.endsWith(".ts")) continue;

    const fileName = entry.name.replace(/\.ts$/, "");

    await copyCompiledModule(compiled, target, fileName);
  }
}

async function copyCompiledModule(sourceDir, targetDir, fileName) {
  await cp(path.join(sourceDir, `${fileName}.js`), path.join(targetDir, `${fileName}.js`));
  await cp(path.join(sourceDir, `${fileName}.d.ts`), path.join(targetDir, `${fileName}.d.ts`));
}

async function rewriteInternalImports(root) {
  const files = await collectFiles(root);

  for (const file of files) {
    if (!file.endsWith(".js") && !file.endsWith(".d.ts")) continue;

    let source = await readFile(file, "utf8");
    let rewritten = source;

    for (const [packageName, packageDir] of Object.entries(internalPackages)) {
      const target = path.join(stagingRoot, "_internal", packageDir, "index.js");
      const relative = toPackageSpecifier(path.relative(path.dirname(file), target));

      rewritten = rewritten.replaceAll(`"${packageName}"`, `"${relative}"`);
      rewritten = rewritten.replaceAll(`'${packageName}'`, `'${relative}'`);
    }

    if (rewritten !== source) {
      await writeFile(file, rewritten);
    }
  }
}

async function rewriteThemeCssAssetUrls() {
  const themeCssPath = path.join(stagingRoot, "theme.css");
  const source = await readFile(themeCssPath, "utf8");
  const rewritten = source.replaceAll("../node_modules/geist/", "../../geist/");

  if (rewritten !== source) {
    await writeFile(themeCssPath, rewritten);
  }
}

async function writePackageJson() {
  const packageJson = {
    name: "@riff-refine/belt",
    version: "0.0.0",
    type: "module",
    exports: Object.fromEntries(
      Object.entries(publicEntrypoints).map(([specifier, fileName]) => {
        if (fileName.endsWith(".css")) {
          return [specifier, `./${fileName}`];
        }

        return [
          specifier,
          {
            types: `./${fileName}.d.ts`,
            default: `./${fileName}.js`,
          },
        ];
      }),
    ),
    files: ["**/*"],
    dependencies: {
      "@effect/platform-node": "4.0.0-beta.66",
      effect: "4.0.0-beta.66",
      geist: "^1.7.2",
    },
    peerDependencies: {
      vite: "^6.3.5",
    },
    peerDependenciesMeta: {
      vite: {
        optional: true,
      },
    },
    engines: {
      node: ">=20",
    },
  };

  await writeFile(
    path.join(stagingRoot, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
}

async function collectFiles(root) {
  const entries = await readdirWithTypes(root);
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

async function readdirWithTypes(dir) {
  const { readdir } = await import("node:fs/promises");

  return readdir(dir, { withFileTypes: true });
}

function toPackageSpecifier(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");

  return normalized.startsWith(".") ? normalized : `./${normalized}`;
}
