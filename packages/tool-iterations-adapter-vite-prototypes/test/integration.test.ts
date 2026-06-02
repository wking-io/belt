import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, assert, describe, it } from "vitest";
import { build, createServer, type ViteDevServer } from "vite";
import { prototypeIterationsVite } from "../src/index.ts";

let fixtureRoot: string | undefined;
let server: ViteDevServer | undefined;

afterEach(async () => {
  if (server) {
    await server.close();
    server = undefined;
  }

  if (fixtureRoot) {
    await rm(fixtureRoot, { force: true, recursive: true });
    fixtureRoot = undefined;
  }
});

describe("prototypeIterationsVite", () => {
  it("serves prototype routes with prototype-specific entry injection", async () => {
    fixtureRoot = await createPrototypeFixture();
    server = await createServer({
      root: fixtureRoot,
      logLevel: "silent",
      server: { middlewareMode: true },
      plugins: [
        prototypeIterationsVite({
          appEntry: "/src/main.ts",
          aliases: ["@/"]
        })
      ],
      resolve: {
        alias: {
          "@": path.join(fixtureRoot, "src")
        }
      }
    });

    const html = await server.transformIndexHtml(
      "/__prototype/one-file",
      await readFile(path.join(fixtureRoot, "index.html"), "utf8")
    );
    const resolved = await server.pluginContainer.resolveId("@/routes/Dashboard?prototype=one-file");

    assert.match(html, /\/src\/main\.ts\?prototype=one-file/);
    assert.ok(resolved);
    assert.match(String(await server.pluginContainer.load(resolved.id)), /one-file-dashboard/);
  });

  it("builds default and sparse prototype graphs with distinct output", async () => {
    fixtureRoot = await createPrototypeFixture();

    await buildPrototype(fixtureRoot, "default");
    await buildPrototype(fixtureRoot, "one-file");
    await buildPrototype(fixtureRoot, "button-shadow");

    assert.match(await readBuiltJs(fixtureRoot, "default"), /default-dashboard/);
    assert.match(await readBuiltJs(fixtureRoot, "default"), /default-button/);
    assert.match(await readBuiltJs(fixtureRoot, "one-file"), /one-file-dashboard/);
    assert.match(await readBuiltJs(fixtureRoot, "one-file"), /default-button/);
    assert.match(await readBuiltJs(fixtureRoot, "button-shadow"), /default-dashboard/);
    assert.match(await readBuiltJs(fixtureRoot, "button-shadow"), /shadow-button/);
  });
});

async function createPrototypeFixture() {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "belt-vite-prototypes-")));

  await mkdir(path.join(root, "src", "routes"), { recursive: true });
  await mkdir(path.join(root, "src", "components"), { recursive: true });
  await mkdir(path.join(root, "prototypes", "one-file", "routes"), { recursive: true });
  await mkdir(path.join(root, "prototypes", "button-shadow", "components"), { recursive: true });
  await writeFile(
    path.join(root, "index.html"),
    `<div id="app"></div><script type="module" src="/src/main.ts"></script>`
  );
  await writeFile(
    path.join(root, "src", "main.ts"),
    `import { render } from "@/App";\ndocument.querySelector("#app")!.textContent = render();\n`
  );
  await writeFile(
    path.join(root, "src", "App.ts"),
    `import { dashboard } from "@/routes/Dashboard";\nimport { button } from "@/components/Button";\nexport function render() { return dashboard + " " + button; }\n`
  );
  await writeFile(
    path.join(root, "src", "routes", "Dashboard.ts"),
    `export const dashboard = "default-dashboard";\n`
  );
  await writeFile(
    path.join(root, "src", "components", "Button.ts"),
    `export const button = "default-button";\n`
  );
  await writeFile(
    path.join(root, "prototypes", "one-file", "routes", "Dashboard.ts"),
    `export const dashboard = "one-file-dashboard";\n`
  );
  await writeFile(
    path.join(root, "prototypes", "button-shadow", "components", "Button.ts"),
    `export const button = "shadow-button";\n`
  );

  return root;
}

async function buildPrototype(root: string, prototypeName: string) {
  await build({
    root,
    logLevel: "silent",
    base: "./",
    plugins: [
      prototypeIterationsVite({
        appEntry: "/src/main.ts",
        aliases: ["@/"],
        buildPrototype: prototypeName
      })
    ],
    resolve: {
      alias: {
        "@": path.join(root, "src")
      }
    },
    build: {
      emptyOutDir: true,
      outDir: path.join(root, "dist-test", prototypeName)
    }
  });
}

async function readBuiltJs(root: string, prototypeName: string) {
  const assetsDir = path.join(root, "dist-test", prototypeName, "assets");
  const jsFile = (await readdir(assetsDir)).find((file) => file.endsWith(".js"));

  if (!jsFile) {
    throw new Error(`No built JS file found for ${prototypeName}`);
  }

  return await readFile(path.join(assetsDir, jsFile), "utf8");
}
