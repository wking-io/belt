import { assert, it } from "@effect/vitest";
import {
  mountRenderPerformanceMeter,
  renderPerformanceTool,
  renderPerformanceToolId,
  type LongAnimationFrameSummary
} from "../src/index.ts";

it("defines the Render Performance tool metadata", () => {
  const tool = renderPerformanceTool();

  assert.strictEqual(renderPerformanceToolId, "render-performance");
  assert.deepStrictEqual(tool, {
    id: "render-performance",
    label: "Render Performance"
  });
});

it("exposes long animation frame summaries", () => {
  const entry = {
    duration: 51,
    entryType: "long-animation-frame",
    name: "long-animation-frame",
    startTime: 12,
    toJSON: () => ({})
  } satisfies PerformanceEntry;
  const summary: LongAnimationFrameSummary = {
    duration: entry.duration,
    entry,
    startTime: entry.startTime
  };

  assert.strictEqual(summary.duration, 51);
  assert.strictEqual(summary.startTime, 12);
});

it("mounts a rolling requestAnimationFrame meter and cleans it up", () => {
  const previousDocument = globalThis.document;
  const previousPerformance = globalThis.performance;
  const previousRequestAnimationFrame = globalThis.requestAnimationFrame;
  const previousCancelAnimationFrame = globalThis.cancelAnimationFrame;
  let rafCallback: FrameRequestCallback | undefined;
  let removed = false;
  let canceledId = 0;
  const element = {
    dataset: {} as Record<string, string>,
    remove: () => {
      removed = true;
    },
    style: {},
    textContent: ""
  };
  const target = {
    appended: undefined as typeof element | undefined,
    appendChild: (node: typeof element) => {
      target.appended = node;
    }
  };

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      body: target,
      createElement: () => element
    }
  });
  Object.defineProperty(globalThis, "performance", {
    configurable: true,
    value: {
      now: () => 0
    }
  });
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      rafCallback = callback;
      return 42;
    }
  });
  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    configurable: true,
    value: (id: number) => {
      canceledId = id;
    }
  });

  try {
    const unmount = mountRenderPerformanceMeter({ observeLongAnimationFrames: false });

    assert.strictEqual(target.appended, element);
    assert.strictEqual(element.dataset.beltRenderPerformanceMeter, "true");

    rafCallback?.(600);
    assert.strictEqual(element.textContent, "2 FPS • 600.0ms");

    unmount();
    assert.strictEqual(canceledId, 42);
    assert.strictEqual(removed, true);
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: previousDocument
    });
    Object.defineProperty(globalThis, "performance", {
      configurable: true,
      value: previousPerformance
    });
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      value: previousRequestAnimationFrame
    });
    Object.defineProperty(globalThis, "cancelAnimationFrame", {
      configurable: true,
      value: previousCancelAnimationFrame
    });
  }
});
