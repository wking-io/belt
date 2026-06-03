import { assert, describe, it } from "vitest";
import { createPrototypeGraphIdentity } from "../src/identity.ts";
import { appendPrototypeToImports } from "../src/imports.ts";
import { createPrototypeRuntimeModule } from "../src/runtime.ts";

describe("prototype Vite adapter modules", () => {
  it("attaches and reads prototype identity from module specifiers", () => {
    const identity = createPrototypeGraphIdentity({
      queryParam: "prototype",
      routePrefix: "/__prototype/"
    });

    const attached = identity.attach("/src/main.tsx", "pricing-test");

    assert.strictEqual(attached, "/src/main.tsx?prototype=pricing-test");
    assert.strictEqual(identity.fromModuleId(attached), "pricing-test");
    assert.strictEqual(identity.fromRoutePath("/__prototype/pricing-test"), "pricing-test");
  });

  it("rewrites app-local imports to carry prototype identity", async () => {
    const identity = createPrototypeGraphIdentity({
      queryParam: "prototype",
      routePrefix: "/__prototype/"
    });
    const result = await appendPrototypeToImports({
      code: `import Button from "@/components/Button";\nexport { Dashboard } from "/src/routes/Dashboard";\n`,
      id: "/src/App.tsx?prototype=pricing-test",
      prototypeName: "pricing-test",
      aliases: ["@/"],
      identity
    });

    assert.match(result?.code ?? "", /@\/components\/Button\?prototype=pricing-test/);
    assert.match(result?.code ?? "", /\/src\/routes\/Dashboard\?prototype=pricing-test/);
  });

  it("creates the prototype runtime virtual module", () => {
    const moduleSource = createPrototypeRuntimeModule({
      current: "default",
      prototypes: ["default", "pricing-test"],
      routePrefix: "/__prototype/"
    });

    assert.match(moduleSource, /export const prototypes = \["default","pricing-test"\];/);
    assert.match(moduleSource, /export const routePrefix = "\/__prototype\/";/);
  });
});
