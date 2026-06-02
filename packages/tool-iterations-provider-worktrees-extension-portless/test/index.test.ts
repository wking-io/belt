import { assert, describe, it } from "vitest";
import { portlessResolver } from "../src/index.ts";

describe("portlessResolver", () => {
  it("resolves a branch-prefixed Portless URL for the default localhost TLD", async () => {
    const resolver = portlessResolver({
      destinations: [{ id: "web", label: "Web", appName: "myapp" }]
    });

    assert.deepStrictEqual(
      await resolver.resolve({
        branch: "fix-ui",
        detached: false,
        path: "/repo/myapp-fix-ui"
      }),
      [
        {
          id: "web",
          label: "Web",
          primary: true,
          url: "https://fix-ui.myapp.localhost"
        }
      ]
    );
  });

  it("resolves main and master without an extra branch subdomain", async () => {
    const resolver = portlessResolver({
      destinations: [{ id: "web", label: "Web", appName: "myapp" }]
    });

    const main = await resolver.resolve({
      branch: "main",
      detached: false,
      path: "/repo/myapp"
    });
    const master = await resolver.resolve({
      branch: "master",
      detached: false,
      path: "/repo/myapp-master"
    });

    assert.strictEqual(main[0]?.url, "https://myapp.localhost");
    assert.strictEqual(master[0]?.url, "https://myapp.localhost");
  });

  it("resolves multiple destinations per worktree", async () => {
    const resolver = portlessResolver({
      destinations: [
        { id: "web", label: "Web", appName: "myapp" },
        { id: "api", label: "API", appName: "api.myapp" }
      ]
    });

    assert.deepStrictEqual(
      await resolver.resolve({
        branch: "new-editor",
        detached: false,
        path: "/repo/myapp-new-editor"
      }),
      [
        {
          id: "web",
          label: "Web",
          primary: true,
          url: "https://new-editor.myapp.localhost"
        },
        {
          id: "api",
          label: "API",
          primary: false,
          url: "https://new-editor.api.myapp.localhost"
        }
      ]
    );
  });
});
