import { assert, describe, it } from "vitest";
import { portlessResolver } from "../src/index.ts";

describe("portlessResolver", () => {
  it("resolves a branch-prefixed Portless URL for the default localhost TLD", async () => {
    const resolver = portlessResolver({
      destinations: [{ id: "web", label: "Web", appName: "myapp" }],
    });

    assert.deepStrictEqual(
      await resolver.resolve({
        branch: "fix-ui",
        path: "/repo/myapp-fix-ui",
      }),
      [
        {
          id: "web",
          label: "Web",
          primary: true,
          url: "https://fix-ui.myapp.localhost",
        },
      ],
    );
  });

  it("normalizes branch names into URL-safe host labels", async () => {
    const resolver = portlessResolver({
      destinations: [{ id: "web", label: "Web", appName: "myapp" }],
    });
    const destinations = await resolver.resolve({
      branch: "refs/heads/feature/audio engine!!!",
      path: "/repo/myapp-audio-engine",
    });

    assert.strictEqual(destinations[0]?.url, "https://feature-audio-engine.myapp.localhost");
  });

  it("resolves main and master without an extra branch subdomain", async () => {
    const resolver = portlessResolver({
      destinations: [{ id: "web", label: "Web", appName: "myapp" }],
    });

    const main = await resolver.resolve({
      branch: "main",
      path: "/repo/myapp",
    });
    const master = await resolver.resolve({
      branch: "master",
      path: "/repo/myapp-master",
    });

    assert.strictEqual(main[0]?.url, "https://myapp.localhost");
    assert.strictEqual(master[0]?.url, "https://myapp.localhost");
  });

  it("supports a custom TLD and main branch names", async () => {
    const resolver = portlessResolver({
      destinations: [{ id: "web", label: "Web", appName: "myapp" }],
      mainBranches: ["trunk"],
      tld: "test",
    });

    const trunk = await resolver.resolve({
      branch: "trunk",
      path: "/repo/myapp",
    });
    const feature = await resolver.resolve({
      branch: "main",
      path: "/repo/myapp-main",
    });

    assert.strictEqual(trunk[0]?.url, "https://myapp.test");
    assert.strictEqual(feature[0]?.url, "https://main.myapp.test");
  });

  it("resolves multiple destinations per worktree", async () => {
    const resolver = portlessResolver({
      destinations: [
        { id: "web", label: "Web", appName: "myapp" },
        { id: "api", label: "API", appName: "api.myapp" },
        { id: "docs", label: "Docs", appName: "docs.myapp", tld: "internal" },
      ],
    });

    assert.deepStrictEqual(
      await resolver.resolve({
        branch: "new-editor",
        path: "/repo/myapp-new-editor",
      }),
      [
        {
          id: "web",
          label: "Web",
          primary: true,
          url: "https://new-editor.myapp.localhost",
        },
        {
          id: "api",
          label: "API",
          primary: false,
          url: "https://new-editor.api.myapp.localhost",
        },
        {
          id: "docs",
          label: "Docs",
          primary: false,
          url: "https://new-editor.docs.myapp.internal",
        },
      ],
    );
  });

  it("rejects empty destination lists at the schema boundary", () => {
    assert.throws(() =>
      portlessResolver({
        destinations: [],
      }),
    );
  });

  it("rejects empty destination app names at the schema boundary", () => {
    assert.throws(() =>
      portlessResolver({
        destinations: [{ id: "web", label: "Web", appName: "" }],
      }),
    );
  });
});
