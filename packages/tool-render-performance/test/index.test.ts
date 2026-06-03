import { assert, it } from "@effect/vitest";
import {
  appendRenderPerformanceSample,
  calculateLayoutShiftSession,
  calculateRenderPerformanceSample,
  getInteractionLatencySeverity,
  getJankSeverity,
  getLayoutShiftSeverity,
  mountRenderPerformanceMeter,
  renderPerformanceTool,
  renderPerformanceToolId,
  type LongAnimationFrameSummary,
} from "../src/index.tsx";

it("defines the Render Performance tool metadata", () => {
  const registration = renderPerformanceTool();

  assert.strictEqual(renderPerformanceToolId, "render-performance");
  assert.deepStrictEqual(registration, {
    tool: {
      id: "render-performance",
      label: "Render Performance",
    },
  });
});

it("exposes long animation frame summaries", () => {
  const entry = {
    duration: 51,
    entryType: "long-animation-frame",
    name: "long-animation-frame",
    startTime: 12,
    toJSON: () => ({}),
  } satisfies PerformanceEntry;
  const summary: LongAnimationFrameSummary = {
    duration: entry.duration,
    entry,
    startTime: entry.startTime,
  };

  assert.strictEqual(summary.duration, 51);
  assert.strictEqual(summary.startTime, 12);
});

it("does not treat a stable lower frame cadence as jank", () => {
  const sample = calculateRenderPerformanceSample({
    endTime: 1000,
    frameDurationsMs: Array.from({ length: 30 }, () => 33),
    frameCount: 30,
    startTime: 0,
  });

  assert.strictEqual(sample.frameBudgetMs, 33);
  assert.strictEqual(sample.fps, 30);
  assert.strictEqual(sample.jankFrameCount, 0);
  assert.strictEqual(sample.jankTimeMs, 0);
  assert.strictEqual(sample.jank, 0);
  assert.strictEqual(sample.severity, "normal");
});

it("calculates jank from over-budget frame time", () => {
  const sample = calculateRenderPerformanceSample({
    endTime: 1000,
    frameDurationsMs: [...Array.from({ length: 58 }, () => 16.7), 120],
    frameCount: 59,
    startTime: 0,
  });

  assert.strictEqual(sample.frameBudgetMs, 16.7);
  assert.strictEqual(sample.jankFrameCount, 1);
  assert.strictEqual(sample.droppedFrameCount, 1);
  assert.strictEqual(Math.round(sample.jankTimeMs), 103);
  assert.strictEqual(Math.round(sample.jank), 10);
  assert.strictEqual(sample.severity, "warning");
  assert.strictEqual(sample.source, "request-animation-frame");
});

it("calculates INP from the slowest interaction in the sample window", () => {
  const firstPointerDown = performanceEntry({
    duration: 80,
    interactionId: 7,
    name: "pointerdown",
    startTime: 100,
  });
  const firstClick = performanceEntry({
    duration: 120,
    interactionId: 7,
    name: "click",
    startTime: 130,
  });
  const secondClick = performanceEntry({
    duration: 90,
    interactionId: 8,
    name: "click",
    startTime: 500,
  });
  const outsideWindow = performanceEntry({
    duration: 200,
    interactionId: 9,
    name: "click",
    startTime: 1200,
  });
  const sample = calculateRenderPerformanceSample({
    endTime: 1000,
    frameCount: 60,
    interactions: [
      toInteraction(firstPointerDown),
      toInteraction(firstClick),
      toInteraction(secondClick),
      toInteraction(outsideWindow),
    ],
    startTime: 0,
  });

  assert.strictEqual(sample.interactionCount, 3);
  assert.strictEqual(sample.interactionLatencyMs, 120);
});

it("calculates layout shift from unexpected shifts in the sample window", () => {
  const sample = calculateRenderPerformanceSample({
    endTime: 1000,
    frameCount: 60,
    layoutShifts: [
      toLayoutShift(performanceEntry({ startTime: 100, value: 0.04 })),
      toLayoutShift(performanceEntry({ hadRecentInput: true, startTime: 300, value: 0.2 })),
      toLayoutShift(performanceEntry({ startTime: 800, value: 0.03 })),
      toLayoutShift(performanceEntry({ startTime: 1200, value: 0.7 })),
    ],
    startTime: 0,
  });

  assert.strictEqual(sample.layoutShiftCount, 2);
  assert.strictEqual(sample.layoutShift, 0.07);
});

it("prefers long-animation-frame entries when they are available", () => {
  const entry = {
    duration: 90,
    entryType: "long-animation-frame",
    name: "long-animation-frame",
    startTime: 300,
    toJSON: () => ({}),
  } satisfies PerformanceEntry;
  const sample = calculateRenderPerformanceSample({
    endTime: 1000,
    frameDurationsMs: Array.from({ length: 30 }, () => 33),
    frameCount: 30,
    longAnimationFrames: [{ duration: 90, entry, startTime: 300 }],
    startTime: 0,
  });

  assert.strictEqual(sample.frameBudgetMs, 33);
  assert.strictEqual(sample.jankFrameCount, 1);
  assert.strictEqual(sample.jankTimeMs, 57);
  assert.strictEqual(sample.jank, 5.7);
  assert.strictEqual(sample.source, "long-animation-frame");
});

it("classifies jank samples by warning and danger thresholds", () => {
  assert.strictEqual(getJankSeverity(0), "normal");
  assert.strictEqual(getJankSeverity(5), "warning");
  assert.strictEqual(getJankSeverity(19.9), "warning");
  assert.strictEqual(getJankSeverity(20), "danger");
});

it("classifies INP samples by warning and danger thresholds", () => {
  assert.strictEqual(getInteractionLatencySeverity(0), "normal");
  assert.strictEqual(getInteractionLatencySeverity(199), "normal");
  assert.strictEqual(getInteractionLatencySeverity(200), "warning");
  assert.strictEqual(getInteractionLatencySeverity(499), "warning");
  assert.strictEqual(getInteractionLatencySeverity(500), "danger");
});

it("classifies layout shift samples by warning and danger thresholds", () => {
  assert.strictEqual(getLayoutShiftSeverity(0), "normal");
  assert.strictEqual(getLayoutShiftSeverity(0.099), "normal");
  assert.strictEqual(getLayoutShiftSeverity(0.1), "warning");
  assert.strictEqual(getLayoutShiftSeverity(0.249), "warning");
  assert.strictEqual(getLayoutShiftSeverity(0.25), "danger");
});

it("calculates layout shift session windows", () => {
  const session = calculateLayoutShiftSession([
    toLayoutShift(performanceEntry({ startTime: 100, value: 0.04 })),
    toLayoutShift(performanceEntry({ startTime: 900, value: 0.03 })),
    toLayoutShift(performanceEntry({ startTime: 2000, value: 0.5 })),
    toLayoutShift(performanceEntry({ hadRecentInput: true, startTime: 2100, value: 0.8 })),
    toLayoutShift(performanceEntry({ startTime: 6100, value: 0.06 })),
  ]);

  assert.strictEqual(session.count, 4);
  assert.strictEqual(Math.round(session.totalValue * 100), 63);
  assert.strictEqual(session.value, 0.5);
  assert.strictEqual(session.lastShiftTime, 6100);
  assert.strictEqual(session.lastShiftValue, 0.06);
});

it("trims render performance history to the rolling window", () => {
  const first = calculateRenderPerformanceSample({
    endTime: 1000,
    frameCount: 60,
    startTime: 0,
  });
  const second = calculateRenderPerformanceSample({
    endTime: 2000,
    frameCount: 54,
    startTime: 1000,
  });
  const third = calculateRenderPerformanceSample({
    endTime: 3000,
    frameCount: 30,
    startTime: 2000,
  });

  const history = appendRenderPerformanceSample(
    appendRenderPerformanceSample(appendRenderPerformanceSample([], first, 2), second, 2),
    third,
    2,
  );

  assert.deepStrictEqual(history, [second, third]);
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
    textContent: "",
  };
  const target = {
    appended: undefined as typeof element | undefined,
    appendChild: (node: typeof element) => {
      target.appended = node;
    },
  };

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      body: target,
      createElement: () => element,
    },
  });
  Object.defineProperty(globalThis, "performance", {
    configurable: true,
    value: {
      now: () => 0,
    },
  });
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      rafCallback = callback;
      return 42;
    },
  });
  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    configurable: true,
    value: (id: number) => {
      canceledId = id;
    },
  });

  try {
    const unmount = mountRenderPerformanceMeter({ observeLongAnimationFrames: false });

    assert.strictEqual(target.appended, element);
    assert.strictEqual(element.dataset.beltRenderPerformanceMeter, "true");

    rafCallback?.(1000);
    assert.strictEqual(element.textContent, "Jank 98% • 1 FPS");

    unmount();
    assert.strictEqual(canceledId, 42);
    assert.strictEqual(removed, true);
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: previousDocument,
    });
    Object.defineProperty(globalThis, "performance", {
      configurable: true,
      value: previousPerformance,
    });
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      value: previousRequestAnimationFrame,
    });
    Object.defineProperty(globalThis, "cancelAnimationFrame", {
      configurable: true,
      value: previousCancelAnimationFrame,
    });
  }
});

function performanceEntry(options: {
  readonly duration?: number;
  readonly hadRecentInput?: boolean;
  readonly interactionId?: number;
  readonly name?: string;
  readonly startTime: number;
  readonly value?: number;
}): PerformanceEntry {
  return {
    duration: options.duration ?? 0,
    entryType: "test",
    name: options.name ?? "test",
    startTime: options.startTime,
    toJSON: () => ({}),
    ...(options.hadRecentInput === undefined ? {} : { hadRecentInput: options.hadRecentInput }),
    ...(options.interactionId === undefined ? {} : { interactionId: options.interactionId }),
    ...(options.value === undefined ? {} : { value: options.value }),
  } as PerformanceEntry;
}

function toInteraction(
  entry: PerformanceEntry,
): NonNullable<Parameters<typeof calculateRenderPerformanceSample>[0]["interactions"]>[number] {
  const eventEntry = entry as PerformanceEntry & {
    readonly interactionId?: number;
  };

  return {
    duration: entry.duration,
    entry,
    interactionId: eventEntry.interactionId ?? 0,
    name: entry.name,
    startTime: entry.startTime,
  };
}

function toLayoutShift(
  entry: PerformanceEntry,
): NonNullable<Parameters<typeof calculateRenderPerformanceSample>[0]["layoutShifts"]>[number] {
  const layoutShiftEntry = entry as PerformanceEntry & {
    readonly hadRecentInput?: boolean;
    readonly value?: number;
  };

  return {
    entry,
    hadRecentInput: layoutShiftEntry.hadRecentInput ?? false,
    startTime: entry.startTime,
    value: layoutShiftEntry.value ?? 0,
  };
}
