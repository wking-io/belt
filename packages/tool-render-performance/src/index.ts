import { defineTool, type ToolDefinition } from "@repo/core";
import { useEffect, type ReactElement } from "react";

export const renderPerformanceToolId = "render-performance";

export type RenderPerformanceToolDefinition = ToolDefinition;

export type LongAnimationFrameSummary = {
  readonly duration: number;
  readonly entry: PerformanceEntry;
  readonly startTime: number;
};

export type RenderPerformanceMeterOptions = {
  readonly className?: string;
  readonly observeLongAnimationFrames?: boolean;
  readonly onLongAnimationFrame?: (frame: LongAnimationFrameSummary) => void;
  readonly target?: HTMLElement;
  readonly updateIntervalMs?: number;
};

export type RenderPerformanceMeterProps = RenderPerformanceMeterOptions;

export function renderPerformanceTool(): RenderPerformanceToolDefinition {
  return defineTool({
    id: renderPerformanceToolId,
    label: "Render Performance"
  });
}

export function mountRenderPerformanceMeter(options: RenderPerformanceMeterOptions = {}): () => void {
  const {
    className,
    observeLongAnimationFrames = true,
    onLongAnimationFrame = logLongAnimationFrame,
    target = document.body,
    updateIntervalMs = 500
  } = options;
  const el = document.createElement("div");
  const updateEveryMs = Math.max(100, updateIntervalMs);
  let frameCount = 0;
  let lastUpdate = performance.now();
  let lastFrame = lastUpdate;
  let rafId = 0;
  let observer: PerformanceObserver | undefined;

  if (className !== undefined) {
    el.className = className;
  }

  Object.assign(el.style, {
    background: "rgba(0,0,0,0.75)",
    borderRadius: "4px",
    color: "white",
    font: "12px monospace",
    padding: "4px 6px",
    pointerEvents: "none",
    position: "fixed",
    right: "8px",
    top: "8px",
    zIndex: "999999"
  });
  el.dataset.beltRenderPerformanceMeter = "true";
  el.textContent = "-- FPS • --ms";
  target.appendChild(el);

  const tick = (now: number) => {
    frameCount += 1;
    const delta = now - lastFrame;
    const elapsed = now - lastUpdate;
    lastFrame = now;

    if (elapsed >= updateEveryMs) {
      const fps = (frameCount * 1000) / elapsed;
      el.textContent = `${fps.toFixed(0)} FPS • ${delta.toFixed(1)}ms`;
      frameCount = 0;
      lastUpdate = now;
    }

    rafId = requestAnimationFrame(tick);
  };

  if (observeLongAnimationFrames && supportsLongAnimationFrameObserver()) {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        onLongAnimationFrame({
          duration: entry.duration,
          entry,
          startTime: entry.startTime
        });
      }
    });
    observer.observe({ type: "long-animation-frame", buffered: true });
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
    observer?.disconnect();
    el.remove();
  };
}

export function RenderPerformanceMeter(props: RenderPerformanceMeterProps): ReactElement | null {
  useEffect(() => mountRenderPerformanceMeter(props), [
    props.className,
    props.observeLongAnimationFrames,
    props.onLongAnimationFrame,
    props.target,
    props.updateIntervalMs
  ]);

  return null;
}

function supportsLongAnimationFrameObserver(): boolean {
  return typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes.includes("long-animation-frame");
}

function logLongAnimationFrame(frame: LongAnimationFrameSummary): void {
  console.debug("Long animation frame:", frame);
}
