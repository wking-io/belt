import { assert, it } from "@effect/vitest";
import { createToolbar } from "@repo/renderer-react";
import type { Iteration } from "@repo/tool-iterations";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createIterationsClient,
  filterIterations,
  getIterationDescription,
  getIterationDisplayLabel,
  getIterationSearchText,
  Iterations,
  iterationsToolId,
  selectFallbackIteration,
} from "../src/index.tsx";

const worktreeIteration = {
  current: true,
  destinations: [
    {
      id: "web",
      label: "Web",
      primary: true,
      url: "http://localhost:5173",
    },
  ],
  id: "worktree:feature-toolbar",
  kind: "worktree",
  label: "feature-toolbar",
  metadata: {
    branch: "feature/toolbar",
    path: "/Users/wking/Developer/toolbar",
  },
} satisfies Iteration;

const prototypeIteration = {
  current: false,
  description: "Prototype run",
  destinations: [
    {
      id: "preview",
      label: "Preview",
      url: "http://localhost:5174",
    },
  ],
  id: "prototype:preview",
  kind: "prototype",
  label: "Preview prototype",
} satisfies Iteration;

it("renders the ready-made Iterations toolbar item from registration", () => {
  const toolbar = createToolbar({
    tools: [
      {
        tool: {
          id: iterationsToolId,
          label: "Iterations",
        },
      },
    ],
  });
  const html = renderToStaticMarkup(
    createElement(
      toolbar.Provider,
      null,
      createElement(Iterations, { initialIterations: [worktreeIteration] }),
    ),
  );

  assert.match(html, /belt-iterations-toolbar-item/);
  assert.match(html, /aria-label="Select iteration"/);
  assert.match(html, /feature\/toolbar/);
});

it("does not render when the Iterations tool is not registered", () => {
  const toolbar = createToolbar({ tools: [] });
  const html = renderToStaticMarkup(
    createElement(
      toolbar.Provider,
      null,
      createElement(Iterations, { initialIterations: [worktreeIteration] }),
    ),
  );

  assert.strictEqual(html, "");
});

it("selects the explicit iteration before the current fallback", () => {
  assert.strictEqual(
    selectFallbackIteration([worktreeIteration, prototypeIteration], prototypeIteration.id),
    prototypeIteration,
  );
  assert.strictEqual(
    selectFallbackIteration([prototypeIteration, worktreeIteration], "missing"),
    worktreeIteration,
  );
  assert.strictEqual(selectFallbackIteration([]), undefined);
});

it("uses worktree metadata for labels and descriptions without requiring worktree-only props", () => {
  assert.strictEqual(getIterationDisplayLabel(worktreeIteration), "feature/toolbar");
  assert.strictEqual(getIterationDescription(worktreeIteration), "/Users/wking/Developer/toolbar");
  assert.strictEqual(getIterationDisplayLabel(prototypeIteration), "Preview prototype");
  assert.strictEqual(getIterationDescription(prototypeIteration), "Prototype run");
});

it("filters iterations by metadata and destination text", () => {
  assert.deepStrictEqual(filterIterations([worktreeIteration, prototypeIteration], "toolbar"), [
    worktreeIteration,
  ]);
  assert.deepStrictEqual(filterIterations([worktreeIteration, prototypeIteration], "5174"), [
    prototypeIteration,
  ]);
  assert.match(getIterationSearchText(worktreeIteration), /\/Users\/wking\/Developer\/toolbar/);
});

it("uses the Iterations tool API route in the browser client", async () => {
  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    requests.push(input instanceof Request ? input.url : String(input));

    return new Response(JSON.stringify({ iterations: [worktreeIteration] }));
  };

  try {
    const client = createIterationsClient({
      baseUrl: "http://belt.local",
    });

    assert.deepStrictEqual(await client.list(), { iterations: [worktreeIteration] });
    assert.deepStrictEqual(requests, ["http://belt.local/__toolbar/tools/iterations/"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

it("allows tests and hosts to override the Iterations client", async () => {
  const requests: string[] = [];
  const toolbar = createToolbar({
    tools: [
      {
        tool: {
          id: iterationsToolId,
          label: "Iterations",
        },
      },
    ],
  });
  const client = {
    list: async () => {
      requests.push("list");

      return { iterations: [prototypeIteration] };
    },
  };

  const html = renderToStaticMarkup(
    createElement(toolbar.Provider, null, createElement(Iterations, { client })),
  );

  assert.match(html, /belt-iterations-toolbar-item/);
  assert.deepStrictEqual(requests, []);
});
